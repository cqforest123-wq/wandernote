import Foundation

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
            return nil
        }

        return try? JSONDecoder().decode(
            ParkingSnapshot.self,
            from: data
        )
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
            return
        }

        defaults.set(
            data,
            forKey: key
        )
    }

    func clear() {
        defaults.removeObject(forKey: key)
    }
}
