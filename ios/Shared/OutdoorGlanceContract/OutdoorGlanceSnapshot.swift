import Foundation

struct OutdoorGlanceSnapshot: Codable, Equatable, Sendable {
    static let currentSchemaVersion = 1

    let schemaVersion: Int
    let snapshotId: UUID
    let generatedAt: Date
    let freshness: OutdoorGlanceFreshness
    let trip: OutdoorGlanceTrip?
    let location: OutdoorGlanceLocation?
    let altitude: OutdoorGlanceAltitude?
    let weather: OutdoorGlanceWeather?
    let sun: OutdoorGlanceSun?
    let activity: OutdoorGlanceActivity?
    let parking: OutdoorGlanceParking?

    func isStale(at date: Date = Date()) -> Bool {
        date > freshness.validUntil
    }
}

struct OutdoorGlanceFreshness: Codable, Equatable, Sendable {
    let validUntil: Date
}

struct OutdoorGlanceTrip: Codable, Equatable, Sendable {
    let id: String
    let name: String
    let dayNumber: Int?
}

struct OutdoorGlanceLocation: Codable, Equatable, Sendable {
    let name: String?
    let latitude: Double
    let longitude: Double
    let horizontalAccuracyMeters: Double?
    let capturedAt: Date
}

struct OutdoorGlanceAltitude: Codable, Equatable, Sendable {
    let meters: Double
    let verticalAccuracyMeters: Double?
    let capturedAt: Date
}

struct OutdoorGlanceWeather: Codable, Equatable, Sendable {
    let temperatureCelsius: Double?
    let apparentTemperatureCelsius: Double?
    let conditionCode: String?
    let precipitationProbability: Double?
    let updatedAt: Date
}

struct OutdoorGlanceSun: Codable, Equatable, Sendable {
    let sunriseAt: Date?
    let sunsetAt: Date?
}

struct OutdoorGlanceActivity: Codable, Equatable, Sendable {
    let steps: Int?
    let distanceMeters: Double?
    let updatedAt: Date
}

struct OutdoorGlanceParking: Codable, Equatable, Sendable {
    let savedAt: Date
    let latitude: Double
    let longitude: Double
    let distanceMeters: Double?
    let bearingDegrees: Double?
}

enum OutdoorGlanceContractError: Error, Equatable {
    case unsupportedSchemaVersion(Int)
}

enum OutdoorGlanceCodec {
    static func encode(_ snapshot: OutdoorGlanceSnapshot) throws -> Data {
        try makeEncoder().encode(snapshot)
    }

    static func decode(_ data: Data) throws -> OutdoorGlanceSnapshot {
        let snapshot = try makeDecoder().decode(
            OutdoorGlanceSnapshot.self,
            from: data
        )

        guard snapshot.schemaVersion == OutdoorGlanceSnapshot.currentSchemaVersion else {
            throw OutdoorGlanceContractError.unsupportedSchemaVersion(
                snapshot.schemaVersion
            )
        }

        return snapshot
    }

    private static func makeEncoder() -> JSONEncoder {
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.sortedKeys]

        encoder.dateEncodingStrategy = .custom { date, encoder in
            var container = encoder.singleValueContainer()
            try container.encode(makeFormatter(fractionalSeconds: true).string(from: date))
        }

        return encoder
    }

    private static func makeDecoder() -> JSONDecoder {
        let decoder = JSONDecoder()

        decoder.dateDecodingStrategy = .custom { decoder in
            let container = try decoder.singleValueContainer()
            let value = try container.decode(String.self)

            if let date = makeFormatter(fractionalSeconds: true).date(from: value) {
                return date
            }

            if let date = makeFormatter(fractionalSeconds: false).date(from: value) {
                return date
            }

            throw DecodingError.dataCorruptedError(
                in: container,
                debugDescription: "Invalid ISO 8601 date: \(value)"
            )
        }

        return decoder
    }

    private static func makeFormatter(
        fractionalSeconds: Bool
    ) -> ISO8601DateFormatter {
        let formatter = ISO8601DateFormatter()

        formatter.formatOptions = fractionalSeconds
            ? [.withInternetDateTime, .withFractionalSeconds]
            : [.withInternetDateTime]

        return formatter
    }
}
