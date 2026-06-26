import Combine
import Foundation

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

        return snapshot.isStale(at: date) ? .stale : .fresh
    }

    func load() {
        guard let data = defaults.data(forKey: cacheKey) else {
            snapshot = nil
            lastErrorDescription = nil
            return
        }

        do {
            snapshot = try OutdoorGlanceCodec.decode(data)
            lastErrorDescription = nil
        } catch {
            snapshot = nil
            lastErrorDescription = String(describing: error)
            defaults.removeObject(forKey: cacheKey)
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
    }

    func save(encodedData data: Data) throws {
        let snapshot = try OutdoorGlanceCodec.decode(data)
        defaults.set(data, forKey: cacheKey)

        self.snapshot = snapshot
        lastErrorDescription = nil
    }

    func clear() {
        defaults.removeObject(forKey: cacheKey)
        snapshot = nil
        lastErrorDescription = nil
    }
}
