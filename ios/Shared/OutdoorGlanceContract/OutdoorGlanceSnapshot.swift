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
    /// Language the user picked inside the iPhone app, so the watch can match it
    /// instead of following its own system locale. Optional and defaulted so
    /// snapshots written by older builds still decode at the same schema version.
    let language: String?
    /// Today's spend, already formatted in the user's home currency by the app.
    let todaySpendText: String?
    /// Decided on the iPhone, whose locale is reliable. The watch bundle keeps
    /// degrading Locale.current to its development language, which is how a
    /// user in Chengdu ended up reading altitude in feet.
    let usesMetric: Bool?

    init(
        schemaVersion: Int,
        snapshotId: UUID,
        generatedAt: Date,
        freshness: OutdoorGlanceFreshness,
        trip: OutdoorGlanceTrip?,
        location: OutdoorGlanceLocation?,
        altitude: OutdoorGlanceAltitude?,
        weather: OutdoorGlanceWeather?,
        sun: OutdoorGlanceSun?,
        activity: OutdoorGlanceActivity?,
        parking: OutdoorGlanceParking?,
        language: String? = nil,
        todaySpendText: String? = nil,
        usesMetric: Bool? = nil
    ) {
        self.schemaVersion = schemaVersion
        self.snapshotId = snapshotId
        self.generatedAt = generatedAt
        self.freshness = freshness
        self.trip = trip
        self.location = location
        self.altitude = altitude
        self.weather = weather
        self.sun = sun
        self.activity = activity
        self.parking = parking
        self.language = language
        self.todaySpendText = todaySpendText
        self.usesMetric = usesMetric
    }

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

enum OutdoorGlanceTransport {
    static let snapshotDataKey = "outdoorGlanceSnapshotV1"
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
