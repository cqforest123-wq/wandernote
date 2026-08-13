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
        print("watch sun event tests passed")
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
