import Combine
import Foundation

private enum SnapshotStoreDiagnostics {
    static func log(_ message: @autoclosure () -> String) {
        #if DEBUG
        print("[WatchGlance] \(message())")
        #endif
    }
}

enum OutdoorGlanceSnapshotAvailability: Equatable {
    case unavailable
    case fresh
    case stale
}

@MainActor
final class OutdoorGlanceSnapshotStore: ObservableObject {
    @Published private(set) var snapshot: OutdoorGlanceSnapshot?
    @Published private(set) var lastErrorDescription: String?

    private let defaults: UserDefaults
    private let cacheKey: String

    init(
        defaults: UserDefaults = .standard,
        cacheKey: String = "outdoorGlance.snapshot.v1"
    ) {
        self.defaults = defaults
        self.cacheKey = cacheKey
        load()
    }

    func availability(
        at date: Date = Date()
    ) -> OutdoorGlanceSnapshotAvailability {
        guard let snapshot else {
            return .unavailable
        }

        if snapshot.isStale(at: date) {
            SnapshotStoreDiagnostics.log(
                "snapshot considered stale"
            )
            return .stale
        }

        return .fresh
    }

    func load() {
        guard let data = defaults.data(forKey: cacheKey) else {
            snapshot = nil
            lastErrorDescription = nil
            SnapshotStoreDiagnostics.log(
                "no cached snapshot found"
            )
            return
        }

        do {
            snapshot = try OutdoorGlanceCodec.decode(data)
            lastErrorDescription = nil
            SnapshotStoreDiagnostics.log(
                "cached snapshot loaded"
            )
        } catch {
            snapshot = nil
            lastErrorDescription = String(describing: error)
            defaults.removeObject(forKey: cacheKey)
            SnapshotStoreDiagnostics.log(
                "cached snapshot invalid and removed"
            )
        }
    }

    func save(_ snapshot: OutdoorGlanceSnapshot) throws {
        guard snapshot.schemaVersion ==
                OutdoorGlanceSnapshot.currentSchemaVersion else {
            throw OutdoorGlanceContractError.unsupportedSchemaVersion(
                snapshot.schemaVersion
            )
        }

        let data = try OutdoorGlanceCodec.encode(snapshot)
        defaults.set(data, forKey: cacheKey)

        self.snapshot = snapshot
        lastErrorDescription = nil
        SnapshotStoreDiagnostics.log(
            "snapshot cache saved"
        )
    }

    func save(encodedData data: Data) throws {
        let snapshot = try OutdoorGlanceCodec.decode(data)
        defaults.set(data, forKey: cacheKey)

        self.snapshot = snapshot
        lastErrorDescription = nil
        SnapshotStoreDiagnostics.log(
            "snapshot cache saved from encoded payload"
        )
    }

    func clear() {
        defaults.removeObject(forKey: cacheKey)
        snapshot = nil
        lastErrorDescription = nil
    }
}
