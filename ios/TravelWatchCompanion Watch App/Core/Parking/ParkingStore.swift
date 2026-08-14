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
        // Parking moved into the App Group so the complication can read it.
        // Fall back to .standard if the group is unavailable rather than
        // silently losing the feature.
        self.defaults = defaults
            ?? GlanceSharedStorage.sharedDefaults
            ?? .standard
        self.key = key
        migrateFromStandardDefaultsIfNeeded()
    }

    /// A parked car saved before the App Group existed still lives in
    /// `.standard`. Move it across once so upgrading users don't lose it.
    private func migrateFromStandardDefaultsIfNeeded() {
        guard defaults != .standard,
              defaults.data(forKey: key) == nil,
              let legacy = UserDefaults.standard.data(forKey: key) else {
            return
        }

        defaults.set(legacy, forKey: key)
        UserDefaults.standard.removeObject(forKey: key)
        ParkingStoreDiagnostics.log(
            "migrated saved parking point into the shared app group"
        )
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
