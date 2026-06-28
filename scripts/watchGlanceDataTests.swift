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
struct WatchGlanceDataTests {
    static func main() {
        testFreshSnapshotMapsToTravelGlance()
        testStaleSnapshotMapsToStaleGlance()
        testMissingSnapshotMapsToUnavailableGlance()
        testMissingOptionalFieldsDoNotCrash()
        print("watch glance data tests passed")
    }

    private static func testFreshSnapshotMapsToTravelGlance() {
        let now = Date(timeIntervalSince1970: 1_800)
        let snapshot = makeSnapshot(
            generatedAt: now,
            validUntil: Date(timeIntervalSince1970: 3_600)
        )

        let glance = GlanceDataMapper.make(
            snapshot: snapshot,
            availability: .fresh,
            at: now
        )

        assert(glance.mode == .travel, "fresh snapshot should be travel")
        assert(glance.title.contains("Kyoto"), "trip title should include name")
        assert(glance.title.contains("2"), "trip title should include day")
        assert(glance.currentLocationName == "Kyoto", "location should map")
        assert(glance.altitudeMeters == 45, "altitude should map")
        assert(glance.temperatureCelsius == 24, "temperature should map")
        assert(glance.stepsToday == 8421, "steps should map")
        assert(glance.isStale == false, "fresh snapshot should not be stale")
    }

    private static func testStaleSnapshotMapsToStaleGlance() {
        let now = Date(timeIntervalSince1970: 7_200)
        let snapshot = makeSnapshot(
            generatedAt: Date(timeIntervalSince1970: 0),
            validUntil: Date(timeIntervalSince1970: 3_600)
        )

        let glance = GlanceDataMapper.make(
            snapshot: snapshot,
            availability: .stale,
            at: now
        )

        assert(glance.mode == .stale, "stale snapshot should be stale mode")
        assert(glance.isStale, "stale flag should be set")
        assert(
            glance.warnings.contains(.staleSnapshot),
            "stale warning should be present"
        )
    }

    private static func testMissingSnapshotMapsToUnavailableGlance() {
        let now = Date(timeIntervalSince1970: 1)
        let glance = GlanceDataMapper.make(
            snapshot: nil,
            availability: .unavailable,
            at: now
        )

        assert(glance.mode == .unavailable, "missing snapshot unavailable")
        assert(glance.lastUpdatedAt == now, "unavailable keeps current time")
        assert(
            glance.warnings.contains(.waitingForData),
            "waiting warning should be present"
        )
    }

    private static func testMissingOptionalFieldsDoNotCrash() {
        let now = Date(timeIntervalSince1970: 1_800)
        let snapshot = OutdoorGlanceSnapshot(
            schemaVersion: OutdoorGlanceSnapshot.currentSchemaVersion,
            snapshotId: UUID(),
            generatedAt: now,
            freshness: OutdoorGlanceFreshness(
                validUntil: Date(timeIntervalSince1970: 3_600)
            ),
            trip: nil,
            location: nil,
            altitude: nil,
            weather: nil,
            sun: nil,
            activity: nil,
            parking: nil
        )

        let glance = GlanceDataMapper.make(
            snapshot: snapshot,
            availability: .fresh,
            at: now
        )

        assert(glance.mode == .travel, "snapshot without trip is still travel")
        assert(glance.currentLocationName == nil, "missing location is nil")
        assert(glance.altitudeMeters == nil, "missing altitude is nil")
        assert(glance.parkingDistanceMeters == nil, "missing parking is nil")
    }

    private static func makeSnapshot(
        generatedAt: Date,
        validUntil: Date
    ) -> OutdoorGlanceSnapshot {
        OutdoorGlanceSnapshot(
            schemaVersion: OutdoorGlanceSnapshot.currentSchemaVersion,
            snapshotId: UUID(),
            generatedAt: generatedAt,
            freshness: OutdoorGlanceFreshness(validUntil: validUntil),
            trip: OutdoorGlanceTrip(
                id: "trip-1",
                name: "Kyoto",
                dayNumber: 2
            ),
            location: OutdoorGlanceLocation(
                name: "Kyoto",
                latitude: 35.0116,
                longitude: 135.7681,
                horizontalAccuracyMeters: nil,
                capturedAt: generatedAt
            ),
            altitude: OutdoorGlanceAltitude(
                meters: 45,
                verticalAccuracyMeters: nil,
                capturedAt: generatedAt
            ),
            weather: OutdoorGlanceWeather(
                temperatureCelsius: 24,
                apparentTemperatureCelsius: nil,
                conditionCode: "2",
                precipitationProbability: nil,
                updatedAt: generatedAt
            ),
            sun: OutdoorGlanceSun(
                sunriseAt: Date(timeIntervalSince1970: 600),
                sunsetAt: Date(timeIntervalSince1970: 3_600)
            ),
            activity: OutdoorGlanceActivity(
                steps: 8421,
                distanceMeters: nil,
                updatedAt: generatedAt
            ),
            parking: OutdoorGlanceParking(
                savedAt: generatedAt,
                latitude: 35.01,
                longitude: 135.76,
                distanceMeters: 240,
                bearingDegrees: nil
            )
        )
    }
}
