import Foundation

/// Shared container between the Watch App and its complication extension.
///
/// The extension is a separate process: it cannot run CoreLocation or
/// HealthKit, so the Watch App flattens everything the complication may need
/// into one record and writes it here. The complication is a pure reader.
public enum GlanceSharedStorage {
    public static let appGroupIdentifier = "group.com.litao0729.wandernote"
    public static let payloadKey = "outdoorGlance.widgetPayload.v1"

    public static var sharedDefaults: UserDefaults? {
        UserDefaults(suiteName: appGroupIdentifier)
    }

    public static func loadPayload(
        from defaults: UserDefaults? = sharedDefaults
    ) -> GlanceWidgetPayload? {
        guard let data = defaults?.data(forKey: payloadKey) else {
            return nil
        }

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601

        return try? decoder.decode(
            GlanceWidgetPayload.self,
            from: data
        )
    }

    @discardableResult
    public static func savePayload(
        _ payload: GlanceWidgetPayload,
        to defaults: UserDefaults? = sharedDefaults
    ) -> Bool {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601

        guard let defaults,
              let data = try? encoder.encode(payload) else {
            return false
        }

        defaults.set(data, forKey: payloadKey)

        return true
    }
}

/// Everything a watch-face complication can render *truthfully* without live
/// sensors.
///
/// Note what is deliberately absent: distance to the parked car. That number
/// only stays correct while location updates, which a complication cannot do —
/// it would keep showing the distance measured when the app was last open. The
/// complication shows `parkingSavedAt` instead, and the app shows the distance.
public struct GlanceWidgetPayload: Codable, Equatable, Sendable {
    public let updatedAt: Date
    public let tripName: String?
    public let dayNumber: Int?
    public let placeName: String?
    public let temperatureCelsius: Double?
    public let sunrise: Date?
    public let sunset: Date?
    public let stepsToday: Int?
    public let parkingSavedAt: Date?
    public let language: String?
    public let todaySpendText: String?

    public init(
        updatedAt: Date,
        tripName: String? = nil,
        dayNumber: Int? = nil,
        placeName: String? = nil,
        temperatureCelsius: Double? = nil,
        sunrise: Date? = nil,
        sunset: Date? = nil,
        stepsToday: Int? = nil,
        parkingSavedAt: Date? = nil,
        language: String? = nil,
        todaySpendText: String? = nil
    ) {
        self.updatedAt = updatedAt
        self.tripName = tripName
        self.dayNumber = dayNumber
        self.placeName = placeName
        self.temperatureCelsius = temperatureCelsius
        self.sunrise = sunrise
        self.sunset = sunset
        self.stepsToday = stepsToday
        self.parkingSavedAt = parkingSavedAt
        self.language = language
        self.todaySpendText = todaySpendText
    }

    /// Daylight left at `date`, recomputed on every timeline entry so the
    /// complication stays correct between writes.
    public func daylightRemaining(
        at date: Date
    ) -> TimeInterval? {
        guard let sunset, sunset > date else {
            return nil
        }

        return sunset.timeIntervalSince(date)
    }

    /// Fraction of today's daylight still ahead, for gauge-style families.
    public func daylightFraction(
        at date: Date
    ) -> Double? {
        guard let sunrise,
              let sunset,
              sunset > sunrise else {
            return nil
        }

        let total = sunset.timeIntervalSince(sunrise)
        let remaining = sunset.timeIntervalSince(date)

        guard total > 0 else {
            return nil
        }

        return min(max(remaining / total, 0), 1)
    }
}
