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
        testTravelSnapshotMergesWatchLocalDataWhenFieldsMissing()
        testTravelSnapshotKeepsLocalDeniedAuthorizationWhenBothMissing()
        testProductionShapedTravelSnapshotStillShowsSunAndParking()
        testSnapshotWithoutTripFallsBackToDailyMode()
        print("watch glance data tests passed")
    }

    /// The iPhone only ever sends trip + destination location + weather;
    /// `sun`, `activity`, `altitude` and `parking` are always nil on the wire
    /// (see `makeOutdoorGlanceSnapshotInputFromAppState`). Every other test in
    /// this file feeds a fully-populated snapshot, which is why travel mode
    /// silently losing sunset, daylight and parking went unnoticed.
    private static func testProductionShapedTravelSnapshotStillShowsSunAndParking() {
        let now = Date(timeIntervalSince1970: 1_800)
        let snapshot = makeProductionShapedSnapshot(
            generatedAt: now,
            validUntil: Date(timeIntervalSince1970: 3_600)
        )

        let daily = DailyGlanceData
            .empty(at: now)
            // Deliberately different from the trip destination: the wearer is in
            // Arashiyama, the trip is filed under Kyoto.
            .updatingLocation(
                authorization: .authorized,
                latitude: 35.0094,
                longitude: 135.6717,
                altitudeMeters: 52
            )
            .updatingLocationName("Arashiyama")
            .updatingSun(
                sunrise: Date(timeIntervalSince1970: 600),
                sunset: Date(timeIntervalSince1970: 10_000),
                daylightRemaining: nil
            )
            .updatingParking(
                latitude: 35.0102,
                longitude: 135.6725,
                distanceMeters: 240,
                savedAt: now
            )
            .updatingSteps(6_842)

        let glance = GlanceDataMapper.make(
            snapshot: snapshot,
            availability: .fresh,
            dailyData: daily,
            at: now
        )

        assert(glance.mode == .travel, "a snapshot with a trip should stay in travel mode")

        assert(
            glance.currentLocationName == "Arashiyama",
            "Location must show where the wearer actually is, not the trip's destination"
        )
        assert(
            glance.latitude == 35.0094 && glance.longitude == 135.6717,
            "travel mode should surface the watch's own coordinates over the static destination"
        )
        assert(
            glance.title.contains("Kyoto") && glance.title.contains("2"),
            "the header still identifies the trip and day, in whatever language is active"
        )

        assert(
            glance.sunset == Date(timeIntervalSince1970: 10_000),
            "travel mode must fall back to the watch's own sunset"
        )
        assert(
            glance.daylightRemaining == 8_200,
            "travel mode must compute daylight from the watch's own sunset"
        )
        assert(
            glance.parkingLatitude == 35.0102 && glance.parkingLongitude == 135.6725,
            "travel mode must fall back to parking saved on the watch, otherwise Back to Parking stays disabled forever"
        )
        assert(
            glance.parkingDistanceMeters == 240,
            "travel mode must fall back to the watch's parking distance"
        )
        assert(
            glance.parkingSavedAt == now,
            "travel mode must fall back to the watch's parking timestamp"
        )
        assert(
            glance.altitudeMeters == 52,
            "travel mode must fall back to the watch's altitude"
        )
        assert(
            glance.stepsToday == 6_842,
            "travel mode must fall back to the watch's step count"
        )
    }

    /// With no trip the iPhone still publishes an all-nil snapshot, and that
    /// snapshot is persisted. If it were treated as travel data the watch could
    /// never return to Daily mode.
    private static func testSnapshotWithoutTripFallsBackToDailyMode() {
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

        let daily = DailyGlanceData
            .empty(at: now)
            .updatingLocation(
                authorization: .authorized,
                latitude: 37.3349,
                longitude: -122.0090,
                altitudeMeters: 18
            )
            .updatingSteps(2_140)

        let glance = GlanceDataMapper.make(
            snapshot: snapshot,
            availability: .fresh,
            dailyData: daily,
            at: now
        )

        assert(
            glance.mode == .daily,
            "a trip-less snapshot must not lock the watch out of Daily mode"
        )
        assert(glance.stepsToday == 2_140, "daily mode should still show local steps")
        assert(
            glance.title == WatchStrings.text("mode.daily"),
            "the daily title must be localized rather than hardcoded English"
        )
    }

    private static func makeProductionShapedSnapshot(
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
            altitude: nil,
            weather: OutdoorGlanceWeather(
                temperatureCelsius: 24,
                apparentTemperatureCelsius: nil,
                conditionCode: "2",
                precipitationProbability: nil,
                updatedAt: generatedAt
            ),
            sun: nil,
            activity: nil,
            parking: nil
        )
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
            dailyData: nil,
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
            dailyData: nil,
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
            dailyData: nil,
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
            dailyData: nil,
            at: now
        )

        assert(
            glance.mode == .unavailable,
            "a trip-less snapshot with no watch data has nothing to show and must not claim to be travel data"
        )
        assert(glance.currentLocationName == nil, "missing location is nil")
        assert(glance.altitudeMeters == nil, "missing altitude is nil")
        assert(glance.parkingDistanceMeters == nil, "missing parking is nil")

        let daily = GlanceDataMapper.make(
            snapshot: nil,
            availability: .unavailable,
            dailyData: .empty(at: now),
            at: now
        )

        assert(daily.mode == .daily, "daily data should produce daily mode")
        assert(
            daily.warnings.contains(.locationPermissionNotDetermined),
            "daily mode should expose location permission status"
        )

        let dailyWithAltitude = DailyGlanceData
            .empty(at: now)
            .updatingLocation(
                authorization: .authorized,
                latitude: 37.7749,
                longitude: -122.4194,
                altitudeMeters: 18.4
            )
        let altitudeGlance = GlanceDataMapper.make(
            snapshot: nil,
            availability: .unavailable,
            dailyData: dailyWithAltitude,
            at: now
        )

        assert(
            altitudeGlance.locationAuthorization == .authorized,
            "authorized location should map"
        )
        assert(
            altitudeGlance.latitude == 37.7749,
            "latitude should map"
        )
        assert(
            altitudeGlance.altitudeMeters == 18.4,
            "altitude should map into daily glance"
        )

        let dailyWithParking = dailyWithAltitude.updatingParking(
            latitude: 37.775,
            longitude: -122.419,
            distanceMeters: 42,
            savedAt: now
        )
        let parkingGlance = GlanceDataMapper.make(
            snapshot: nil,
            availability: .unavailable,
            dailyData: dailyWithParking,
            at: now
        )

        assert(
            parkingGlance.parkingDistanceMeters == 42,
            "parking distance should map into daily glance"
        )
        assert(
            parkingGlance.parkingSavedAt == now,
            "parking timestamp should map into daily glance"
        )

        let dailyWithSun = dailyWithParking.updatingSun(
            sunrise: Date(timeIntervalSince1970: 100),
            sunset: Date(timeIntervalSince1970: 10_000),
            daylightRemaining: nil
        )
        let sunGlance = GlanceDataMapper.make(
            snapshot: nil,
            availability: .unavailable,
            dailyData: dailyWithSun,
            at: now
        )

        assert(
            sunGlance.sunset == Date(timeIntervalSince1970: 10_000),
            "daily sunset should map"
        )
        assert(
            sunGlance.daylightRemaining == 8_200,
            "daily daylight remaining should calculate from render time"
        )

        let dailyWithSteps = dailyWithSun.updatingSteps(1_234)
        let stepsGlance = GlanceDataMapper.make(
            snapshot: nil,
            availability: .unavailable,
            dailyData: dailyWithSteps,
            at: now
        )

        assert(
            stepsGlance.stepsToday == 1_234,
            "daily steps should map"
        )
    }

    private static func testTravelSnapshotMergesWatchLocalDataWhenFieldsMissing() {
        let now = Date(timeIntervalSince1970: 1_800)
        let snapshot = OutdoorGlanceSnapshot(
            schemaVersion: OutdoorGlanceSnapshot.currentSchemaVersion,
            snapshotId: UUID(),
            generatedAt: now,
            freshness: OutdoorGlanceFreshness(
                validUntil: Date(timeIntervalSince1970: 3_600)
            ),
            trip: OutdoorGlanceTrip(
                id: "trip-1",
                name: "Yellowstone",
                dayNumber: 1
            ),
            location: nil,
            altitude: nil,
            weather: nil,
            sun: nil,
            activity: nil,
            parking: nil
        )

        let watchLocalData = DailyGlanceData
            .empty(at: now)
            .updatingLocation(
                authorization: .authorized,
                latitude: 29.6332,
                longitude: 106.4740,
                altitudeMeters: 238
            )
            .updatingSteps(4_072)

        let glance = GlanceDataMapper.make(
            snapshot: snapshot,
            availability: .fresh,
            dailyData: watchLocalData,
            at: now
        )

        assert(glance.mode == .travel, "travel snapshot without location/steps should stay travel")
        assert(
            glance.locationAuthorization == .authorized,
            "watch local authorization should be used when snapshot has no location"
        )
        assert(glance.latitude == 29.6332, "watch local latitude should fill travel mode")
        assert(glance.longitude == 106.4740, "watch local longitude should fill travel mode")
        assert(glance.altitudeMeters == 238, "watch local altitude should fill travel mode")
        assert(glance.stepsToday == 4_072, "watch local steps should fill travel mode")
    }

    private static func testTravelSnapshotKeepsLocalDeniedAuthorizationWhenBothMissing() {
        let now = Date(timeIntervalSince1970: 1_800)
        let snapshot = OutdoorGlanceSnapshot(
            schemaVersion: OutdoorGlanceSnapshot.currentSchemaVersion,
            snapshotId: UUID(),
            generatedAt: now,
            freshness: OutdoorGlanceFreshness(
                validUntil: Date(timeIntervalSince1970: 3_600)
            ),
            trip: OutdoorGlanceTrip(
                id: "trip-1",
                name: "Yellowstone",
                dayNumber: 1
            ),
            location: nil,
            altitude: nil,
            weather: nil,
            sun: nil,
            activity: nil,
            parking: nil
        )

        let deniedLocalData = DailyGlanceData
            .empty(at: now)
            .updatingLocation(
                authorization: .denied,
                latitude: nil,
                longitude: nil,
                altitudeMeters: nil
            )

        let glance = GlanceDataMapper.make(
            snapshot: snapshot,
            availability: .fresh,
            dailyData: deniedLocalData,
            at: now
        )

        assert(glance.mode == .travel, "travel snapshot without location should stay travel")
        assert(
            glance.locationAuthorization == .denied,
            "travel mode should surface the real local denial instead of a hardcoded authorized state"
        )
        assert(glance.latitude == nil, "denied local authorization should not fabricate coordinates")
        assert(glance.stepsToday == nil, "steps stay nil when neither snapshot nor watch has data")
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
