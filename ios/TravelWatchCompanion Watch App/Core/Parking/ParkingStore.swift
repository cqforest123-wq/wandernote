import Foundation

private enum ParkingStoreDiagnostics {
    static func log(_ message: @autoclosure () -> String) {
        #if DEBUG
        print("[WatchGlance] \(message())")
        #endif
    }
}

struct ParkingSnapshot: Codable, Equatable {
    let latitude: Double
    let longitude: Double
    let savedAt: Date
}

final class ParkingStore {
    private let defaults: UserDefaults
    private let key: String

    init(
        defaults: UserDefaults? = nil,
        key: String = "wandernote.watch.parking.snapshot"
    ) {
        self.defaults = defaults ?? .standard
        self.key = key
    }

    func load() -> ParkingSnapshot? {
        guard let data = defaults.data(forKey: key) else {
            ParkingStoreDiagnostics.log(
                "parking loaded: none saved"
            )
            return nil
        }

        let snapshot = try? JSONDecoder().decode(
            ParkingSnapshot.self,
            from: data
        )
        ParkingStoreDiagnostics.log(
            snapshot == nil
                ? "parking load failed; saved data is invalid"
                : "parking loaded from local watch storage"
        )

        return snapshot
    }

    func save(
        latitude: Double,
        longitude: Double,
        at date: Date = Date()
    ) {
        let snapshot = ParkingSnapshot(
            latitude: latitude,
            longitude: longitude,
            savedAt: date
        )

        guard let data = try? JSONEncoder().encode(snapshot) else {
            ParkingStoreDiagnostics.log(
                "parking save failed during encoding"
            )
            return
        }

        defaults.set(
            data,
            forKey: key
        )
        ParkingStoreDiagnostics.log(
            "parking saved to local watch storage"
        )
    }

    func clear() {
        defaults.removeObject(forKey: key)
        ParkingStoreDiagnostics.log(
            "parking cleared from local watch storage"
        )
    }
}
