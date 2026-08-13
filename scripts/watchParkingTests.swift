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
struct WatchParkingTests {
    static func main() {
        testSaveLoadAndClear()
        testDistanceCalculation()
        print("watch parking tests passed")
    }

    private static func testSaveLoadAndClear() {
        let suiteName = "wandernote-watch-parking-tests-\(UUID().uuidString)"
        guard let defaults = UserDefaults(suiteName: suiteName) else {
            fatalError("failed to create test defaults")
        }
        defer {
            defaults.removePersistentDomain(forName: suiteName)
        }

        let store = ParkingStore(
            defaults: defaults,
            key: "parking"
        )
        let savedAt = Date(timeIntervalSince1970: 1_234)

        assert(store.load() == nil, "new store should be empty")

        store.save(
            latitude: 37.7749,
            longitude: -122.4194,
            at: savedAt
        )

        let snapshot = store.load()

        assert(snapshot?.latitude == 37.7749, "latitude should persist")
        assert(snapshot?.longitude == -122.4194, "longitude should persist")
        assert(snapshot?.savedAt == savedAt, "saved date should persist")

        store.clear()
        assert(store.load() == nil, "clear should remove parking")
    }

    private static func testDistanceCalculation() {
        let distance = GeoDistance.meters(
            fromLatitude: 37.7749,
            fromLongitude: -122.4194,
            toLatitude: 37.7759,
            toLongitude: -122.4194
        )

        assert(distance > 100, "nearby points should be more than 100m apart")
        assert(distance < 120, "nearby points should be less than 120m apart")
    }
}
