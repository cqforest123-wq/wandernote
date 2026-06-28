import Foundation

private enum SunEventDiagnostics {
    static func log(_ message: @autoclosure () -> String) {
        #if DEBUG
        print("[WatchGlance] \(message())")
        #endif
    }
}

struct SunEventSnapshot: Equatable {
    let sunrise: Date?
    let sunset: Date?
    let daylightRemaining: TimeInterval?
}

enum SunEventCalculator {
    static func events(
        on date: Date = Date(),
        latitude: Double?,
        longitude: Double?,
        calendar: Calendar = .current
    ) -> SunEventSnapshot {
        guard let latitude,
              let longitude,
              (-90...90).contains(latitude),
              (-180...180).contains(longitude) else {
            SunEventDiagnostics.log(
                "sun unavailable because coordinates are missing or invalid"
            )
            return SunEventSnapshot(
                sunrise: nil,
                sunset: nil,
                daylightRemaining: nil
            )
        }

        let sunrise = eventTime(
            on: date,
            latitude: latitude,
            longitude: longitude,
            calendar: calendar,
            isSunrise: true
        )
        let sunset = eventTime(
            on: date,
            latitude: latitude,
            longitude: longitude,
            calendar: calendar,
            isSunrise: false
        )
        let daylightRemaining: TimeInterval?

        if let sunset, sunset > date {
            daylightRemaining = sunset.timeIntervalSince(date)
        } else {
            daylightRemaining = nil
            SunEventDiagnostics.log(
                "daylight remaining unavailable because sunset has passed or is missing"
            )
        }

        if sunrise == nil || sunset == nil {
            SunEventDiagnostics.log(
                "sunrise or sunset unavailable for this date/location"
            )
        }

        return SunEventSnapshot(
            sunrise: sunrise,
            sunset: sunset,
            daylightRemaining: daylightRemaining
        )
    }

    private static func eventTime(
        on date: Date,
        latitude: Double,
        longitude: Double,
        calendar: Calendar,
        isSunrise: Bool
    ) -> Date? {
        guard let utcMidnight = utcMidnight(
            matchingLocalDateOf: date,
            calendar: calendar
        ) else {
            SunEventDiagnostics.log(
                "sun event unavailable because UTC date could not be resolved"
            )
            return nil
        }

        var utcCalendar = Calendar(identifier: .gregorian)
        utcCalendar.timeZone = TimeZone(secondsFromGMT: 0)!

        guard let dayOfYear = utcCalendar.ordinality(
            of: .day,
            in: .year,
            for: utcMidnight
        ) else {
            SunEventDiagnostics.log(
                "sun event unavailable because day-of-year could not be resolved"
            )
            return nil
        }

        let longitudeHour = longitude / 15
        let targetHour = isSunrise ? 6.0 : 18.0
        let approximateTime = Double(dayOfYear) +
            ((targetHour - longitudeHour) / 24)
        let meanAnomaly = (0.9856 * approximateTime) - 3.289
        let trueLongitude = normalizedDegrees(
            meanAnomaly
                + (1.916 * sinDegrees(meanAnomaly))
                + (0.020 * sinDegrees(2 * meanAnomaly))
                + 282.634
        )
        var rightAscension = normalizedDegrees(
            atanDegrees(0.91764 * tanDegrees(trueLongitude))
        )
        let longitudeQuadrant = floor(trueLongitude / 90) * 90
        let ascensionQuadrant = floor(rightAscension / 90) * 90
        rightAscension += longitudeQuadrant - ascensionQuadrant
        rightAscension /= 15

        let sinDeclination = 0.39782 * sinDegrees(trueLongitude)
        let cosDeclination = cos(asin(sinDeclination))
        let cosHourAngle = (
            cosDegrees(90.833)
                - (sinDeclination * sinDegrees(latitude))
        ) / (cosDeclination * cosDegrees(latitude))

        guard (-1...1).contains(cosHourAngle) else {
            SunEventDiagnostics.log(
                "sun event unavailable for polar daylight edge case"
            )
            return nil
        }

        let hourAngleDegrees: Double

        if isSunrise {
            hourAngleDegrees = 360 - acosDegrees(cosHourAngle)
        } else {
            hourAngleDegrees = acosDegrees(cosHourAngle)
        }

        let localMeanTime = (hourAngleDegrees / 15)
            + rightAscension
            - (0.06571 * approximateTime)
            - 6.622
        let universalTime = normalizedHours(
            localMeanTime - longitudeHour
        )

        return utcMidnight.addingTimeInterval(
            universalTime * 60 * 60
        )
    }

    private static func utcMidnight(
        matchingLocalDateOf date: Date,
        calendar: Calendar
    ) -> Date? {
        let components = calendar.dateComponents(
            [.year, .month, .day],
            from: date
        )
        var utcCalendar = Calendar(identifier: .gregorian)
        utcCalendar.timeZone = TimeZone(secondsFromGMT: 0)!

        return utcCalendar.date(from: components)
    }

    private static func normalizedDegrees(
        _ degrees: Double
    ) -> Double {
        let value = degrees.truncatingRemainder(dividingBy: 360)
        return value < 0 ? value + 360 : value
    }

    private static func normalizedHours(
        _ hours: Double
    ) -> Double {
        let value = hours.truncatingRemainder(dividingBy: 24)
        return value < 0 ? value + 24 : value
    }

    private static func sinDegrees(
        _ degrees: Double
    ) -> Double {
        sin(degrees * .pi / 180)
    }

    private static func cosDegrees(
        _ degrees: Double
    ) -> Double {
        cos(degrees * .pi / 180)
    }

    private static func tanDegrees(
        _ degrees: Double
    ) -> Double {
        tan(degrees * .pi / 180)
    }

    private static func atanDegrees(
        _ value: Double
    ) -> Double {
        atan(value) * 180 / .pi
    }

    private static func acosDegrees(
        _ value: Double
    ) -> Double {
        acos(value) * 180 / .pi
    }
}
