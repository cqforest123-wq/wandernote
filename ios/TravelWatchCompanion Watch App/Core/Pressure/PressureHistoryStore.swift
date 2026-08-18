import Foundation

struct PressureReading: Equatable {
    let kilopascals: Double
    let at: Date
}

/// Keeps a few hours of pressure readings across launches.
///
/// The trend is the whole point, and a trend needs history — starting empty on
/// every launch would leave the reading as a bare number nobody can act on.
enum PressureHistoryStore {
    private static let key = "outdoorGlance.pressureHistory.v1"

    /// Roughly three hours of samples, with room to spare.
    static let maxEntries = 240

    /// Drop anything older than this so the store cannot grow without bound.
    static let retention: TimeInterval = 6 * 60 * 60

    private struct Stored: Codable {
        let kPa: Double
        let at: Date
    }

    static func appending(
        _ reading: PressureReading,
        to history: [PressureReading],
        now: Date = Date()
    ) -> [PressureReading] {
        var next = history.filter {
            now.timeIntervalSince($0.at) <= retention
        }

        next.append(reading)

        if next.count > maxEntries {
            next.removeFirst(next.count - maxEntries)
        }

        return next
    }

    static func load(
        from defaults: UserDefaults? = GlanceSharedStorage.sharedDefaults
    ) -> [PressureReading] {
        guard let data = defaults?.data(forKey: key) else {
            return []
        }

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601

        guard let stored = try? decoder.decode([Stored].self, from: data) else {
            return []
        }

        return stored.map {
            PressureReading(kilopascals: $0.kPa, at: $0.at)
        }
    }

    static func save(
        _ history: [PressureReading],
        to defaults: UserDefaults? = GlanceSharedStorage.sharedDefaults
    ) {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601

        let stored = history.map { Stored(kPa: $0.kilopascals, at: $0.at) }

        guard let data = try? encoder.encode(stored) else {
            return
        }

        defaults?.set(data, forKey: key)
    }
}

/// Which way the pressure is heading.
///
/// A single pressure number means little to most people; a falling one is the
/// oldest weather signal there is, and on a trail it arrives well before any
/// forecast does.
enum PressureTrend {
    /// Compare against a reading this old. Shorter and ordinary noise looks
    /// like weather; much longer and a real change arrives too late to matter.
    static let window: TimeInterval = 3 * 60 * 60

    /// A change smaller than this is instrument noise, not weather.
    static let significantChangeKPa: Double = 0.15

    /// `true` falling, `false` rising, `nil` steady or not enough history yet.
    static func falling(
        in history: [PressureReading],
        now: Date = Date()
    ) -> Bool? {
        guard let latest = history.last else {
            return nil
        }

        // Oldest reading still inside the window. Without one there is no
        // trend to report, and comparing two adjacent samples would call every
        // breath of noise a storm.
        guard let reference = history.first(where: {
            now.timeIntervalSince($0.at) <= window
        }), reference.at < latest.at else {
            return nil
        }

        let delta = latest.kilopascals - reference.kilopascals

        if abs(delta) < significantChangeKPa {
            return nil
        }

        return delta < 0
    }
}
