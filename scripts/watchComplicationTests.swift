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
struct WatchComplicationTests {
    static func main() {
        testPayloadRoundTripsThroughSharedStorage()
        testDaylightRemainingCountsDownAndStopsAtSunset()
        testDaylightFractionSpansSunriseToSunset()
        testMissingSunDataDoesNotFabricateDaylight()
        print("watch complication tests passed")
    }

    /// The Watch App writes and the extension reads; if the encoding pair ever
    /// drifts the complication silently shows placeholder content forever.
    private static func testPayloadRoundTripsThroughSharedStorage() {
        let defaults = UserDefaults(
            suiteName: "wandernote.complication.tests"
        )!
        defaults.removePersistentDomain(
            forName: "wandernote.complication.tests"
        )

        let now = Date(timeIntervalSince1970: 1_800_000)
        let payload = GlanceWidgetPayload(
            updatedAt: now,
            tripName: "Kyoto · Day 2",
            dayNumber: 2,
            placeName: "Arashiyama",
            temperatureCelsius: 24,
            sunrise: now.addingTimeInterval(-3_600 * 5),
            sunset: now.addingTimeInterval(3_600 * 3),
            stepsToday: 6_842,
            parkingSavedAt: now.addingTimeInterval(-4_800),
            language: "ja"
        )

        assert(
            GlanceSharedStorage.savePayload(payload, to: defaults),
            "payload should save into the shared container"
        )

        let loaded = GlanceSharedStorage.loadPayload(from: defaults)

        assert(loaded == payload, "payload must survive the round trip intact")
        assert(
            loaded?.language == "ja",
            "language must reach the extension so the face matches the phone"
        )

        defaults.removePersistentDomain(
            forName: "wandernote.complication.tests"
        )
    }

    private static func testDaylightRemainingCountsDownAndStopsAtSunset() {
        let now = Date(timeIntervalSince1970: 1_800_000)
        let payload = makePayload(
            sunrise: now.addingTimeInterval(-3_600 * 5),
            sunset: now.addingTimeInterval(3_600 * 2)
        )

        assert(
            payload.daylightRemaining(at: now) == 3_600 * 2,
            "daylight remaining should measure to sunset"
        )
        assert(
            payload.daylightRemaining(
                at: now.addingTimeInterval(3_600)
            ) == 3_600,
            "daylight remaining should shrink as the timeline advances"
        )
        assert(
            payload.daylightRemaining(
                at: now.addingTimeInterval(3_600 * 3)
            ) == nil,
            "after sunset there is no daylight left; the view falls back to sunset time rather than showing 0h 0m"
        )
    }

    private static func testDaylightFractionSpansSunriseToSunset() {
        let sunrise = Date(timeIntervalSince1970: 1_000_000)
        let sunset = sunrise.addingTimeInterval(3_600 * 10)
        let payload = makePayload(sunrise: sunrise, sunset: sunset)

        assert(
            payload.daylightFraction(at: sunrise) == 1,
            "the gauge should be full at sunrise"
        )
        assert(
            payload.daylightFraction(at: sunset) == 0,
            "the gauge should be empty at sunset"
        )

        let midday = sunrise.addingTimeInterval(3_600 * 5)

        assert(
            abs((payload.daylightFraction(at: midday) ?? -1) - 0.5) < 0.0001,
            "the gauge should be half full at midday"
        )
        assert(
            payload.daylightFraction(
                at: sunset.addingTimeInterval(3_600)
            ) == 0,
            "the gauge must clamp rather than go negative after dark"
        )
    }

    private static func testMissingSunDataDoesNotFabricateDaylight() {
        let now = Date(timeIntervalSince1970: 1_800_000)
        let payload = GlanceWidgetPayload(updatedAt: now)

        assert(
            payload.daylightRemaining(at: now) == nil,
            "no sun data must not produce a daylight countdown"
        )
        assert(
            payload.daylightFraction(at: now) == nil,
            "no sun data must not produce a gauge value"
        )
    }

    private static func makePayload(
        sunrise: Date,
        sunset: Date
    ) -> GlanceWidgetPayload {
        GlanceWidgetPayload(
            updatedAt: sunrise,
            sunrise: sunrise,
            sunset: sunset
        )
    }
}
