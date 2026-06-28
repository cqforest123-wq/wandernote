import Foundation

private enum GlanceMapperDiagnostics {
    static func log(_ message: @autoclosure () -> String) {
        #if DEBUG
        print("[WatchGlance] \(message())")
        #endif
    }
}

enum GlanceDataMapper {
    static func make(
        snapshot: OutdoorGlanceSnapshot?,
        availability: OutdoorGlanceSnapshotAvailability,
        dailyData: DailyGlanceData? = nil,
        at date: Date = Date()
    ) -> GlanceData {
        guard let snapshot else {
            if let dailyData {
                GlanceMapperDiagnostics.log(
                    "Daily fallback selected because no iPhone snapshot is available"
                )
                return makeDailyGlance(
                    dailyData,
                    at: date
                )
            }

            return GlanceData.unavailable(at: date)
        }

        let isStale = availability == .stale ||
            snapshot.isStale(at: date)
        let tripTitle = title(for: snapshot.trip)
        let locationName = snapshot.location?.name
        let mode: GlanceMode = isStale ? .stale : .travel

        if isStale {
            GlanceMapperDiagnostics.log(
                "stale travel snapshot selected"
            )
        }

        return GlanceData(
            mode: mode,
            title: tripTitle ?? "WanderNote",
            subtitle: locationName,
            currentLocationName: locationName,
            locationAuthorization: .authorized,
            latitude: snapshot.location?.latitude,
            longitude: snapshot.location?.longitude,
            altitudeMeters: snapshot.altitude?.meters,
            temperatureCelsius: snapshot.weather?.temperatureCelsius,
            weatherSummary: snapshot.weather?.conditionCode,
            sunrise: snapshot.sun?.sunriseAt,
            sunset: snapshot.sun?.sunsetAt,
            daylightRemaining: daylightRemaining(
                until: snapshot.sun?.sunsetAt,
                from: date
            ),
            parkingLatitude: snapshot.parking?.latitude,
            parkingLongitude: snapshot.parking?.longitude,
            parkingDistanceMeters: snapshot.parking?.distanceMeters,
            parkingSavedAt: snapshot.parking?.savedAt,
            stepsToday: snapshot.activity?.steps,
            lastUpdatedAt: snapshot.generatedAt,
            isStale: isStale,
            warnings: isStale ? [.staleSnapshot] : []
        )
    }

    private static func makeDailyGlance(
        _ dailyData: DailyGlanceData,
        at date: Date
    ) -> GlanceData {
        GlanceData(
            mode: .daily,
            title: "Daily Glance",
            subtitle: dailyData.currentLocationName,
            currentLocationName: dailyData.currentLocationName,
            locationAuthorization: dailyData.locationAuthorization,
            latitude: dailyData.latitude,
            longitude: dailyData.longitude,
            altitudeMeters: dailyData.altitudeMeters,
            temperatureCelsius: nil,
            weatherSummary: nil,
            sunrise: dailyData.sunrise,
            sunset: dailyData.sunset,
            daylightRemaining: daylightRemaining(
                until: dailyData.sunset,
                from: date
            ) ?? dailyData.daylightRemaining,
            parkingLatitude: dailyData.parkingLatitude,
            parkingLongitude: dailyData.parkingLongitude,
            parkingDistanceMeters: dailyData.parkingDistanceMeters,
            parkingSavedAt: dailyData.parkingSavedAt,
            stepsToday: dailyData.stepsToday,
            lastUpdatedAt: dailyData.generatedAt,
            isStale: false,
            warnings: dailyWarnings(for: dailyData)
        )
    }

    private static func dailyWarnings(
        for data: DailyGlanceData
    ) -> [GlanceStatusLine] {
        switch data.locationAuthorization {
        case .authorized:
            return []
        case .notDetermined:
            return [.locationPermissionNotDetermined]
        case .denied:
            return [.locationPermissionDenied]
        case .restricted:
            return [.locationPermissionRestricted]
        case .unavailable:
            return [.locationUnavailable]
        }
    }

    private static func title(
        for trip: OutdoorGlanceTrip?
    ) -> String? {
        guard let trip else {
            return nil
        }

        guard let dayNumber = trip.dayNumber else {
            return trip.name
        }

        return WatchStrings.format(
            "trip.dayFormat",
            trip.name,
            dayNumber
        )
    }

    private static func daylightRemaining(
        until sunset: Date?,
        from date: Date
    ) -> TimeInterval? {
        guard let sunset, sunset > date else {
            return nil
        }

        return sunset.timeIntervalSince(date)
    }
}
