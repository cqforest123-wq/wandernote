import Foundation

func assert(
    _ condition: @autoclosure () -> Bool,
    _ message: String
) {
    if !condition() {
        fatalError(message)
    }
}

@main
struct WatchSunEventTests {
    static func main() {
        testEquinoxAtGreenwich()
        testInvalidCoordinates()
        testPolarDayDoesNotCrash()
        testSunriseAndSunsetLandOnTheSameLocalDay()
        print("watch sun event tests passed")
    }

    /// The algorithm works from UTC midnight, so at eastern longitudes it used
    /// to return tomorrow's sunrise beside today's sunset. Nothing noticed
    /// until a daylight gauge tried to measure the span between them, got a
    /// negative interval, and silently rendered "unavailable".
    private static func testSunriseAndSunsetLandOnTheSameLocalDay() {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(identifier: "Asia/Shanghai")!

        // 17:00 local — past sunrise, before sunset.
        let afternoon = calendar.date(
            from: DateComponents(
                year: 2026, month: 8, day: 14, hour: 17, minute: 0
            )
        )!

        // Guiyang: far enough east of its time zone's meridian to trip this.
        let events = SunEventCalculator.events(
            on: afternoon,
            latitude: 26.6470,
            longitude: 106.6302,
            calendar: calendar
        )

        guard let sunrise = events.sunrise, let sunset = events.sunset else {
            fatalError("both sun events should resolve for Guiyang in August")
        }

        assert(
            calendar.isDate(sunrise, inSameDayAs: afternoon),
            "sunrise must fall on the same local day as the reference time"
        )
        assert(
            calendar.isDate(sunset, inSameDayAs: afternoon),
            "sunset must fall on the same local day as the reference time"
        )
        assert(
            sunset > sunrise,
            "sunset must come after sunrise, or a daylight gauge has no span to measure"
        )
        assert(
            events.daylightRemaining != nil,
            "there is still daylight at 17:00 in August"
        )
    }

    private static func testEquinoxAtGreenwich() {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(secondsFromGMT: 0) ?? .gmt
        let date = calendar.date(
            from: DateComponents(
                year: 2026,
                month: 3,
                day: 20,
                hour: 12
            )
        )!

        let events = SunEventCalculator.events(
            on: date,
            latitude: 0,
            longitude: 0,
            calendar: calendar
        )

        assert(events.sunrise != nil, "sunrise should exist")
        assert(events.sunset != nil, "sunset should exist")
        assert(events.sunrise! < events.sunset!, "sunrise should be before sunset")
        assert(
            events.daylightRemaining != nil &&
                events.daylightRemaining! > 0,
            "daylight should remain at midday"
        )
    }

    private static func testInvalidCoordinates() {
        let events = SunEventCalculator.events(
            latitude: 120,
            longitude: 0
        )

        assert(events.sunrise == nil, "invalid latitude should not produce sunrise")
        assert(events.sunset == nil, "invalid latitude should not produce sunset")
        assert(
            events.daylightRemaining == nil,
            "invalid latitude should not produce daylight"
        )
    }

    private static func testPolarDayDoesNotCrash() {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(secondsFromGMT: 0) ?? .gmt
        let date = calendar.date(
            from: DateComponents(
                year: 2026,
                month: 6,
                day: 21,
                hour: 12
            )
        )!

        let events = SunEventCalculator.events(
            on: date,
            latitude: 89,
            longitude: 0,
            calendar: calendar
        )

        assert(events.daylightRemaining == nil, "polar day should be gracefully empty")
    }
}
