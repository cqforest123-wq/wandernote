import Foundation

/// Remembers the last local reading so a relaunch has something to show
/// immediately.
///
/// Without this the store starts from `.empty()` on every launch and the whole
/// screen reads "unavailable" for the seconds it takes CoreLocation and
/// HealthKit to report — which is most of the time anyone actually looks at a
/// watch. The cached values are labelled by the existing "Updated" row, so a
/// stale reading is visible as stale rather than passed off as current.
enum DailyGlanceCache {
    private static let key = "outdoorGlance.dailyGlance.v1"

    private struct Stored: Codable {
        let generatedAt: Date
        let locationAuthorization: String
        let currentLocationName: String?
        let latitude: Double?
        let longitude: Double?
        let altitudeMeters: Double?
        let parkingLatitude: Double?
        let parkingLongitude: Double?
        let parkingSavedAt: Date?
        let stepsToday: Int?
    }

    static func load(
        from defaults: UserDefaults? = GlanceSharedStorage.sharedDefaults,
        now: Date = Date(),
        calendar: Calendar = .current
    ) -> DailyGlanceData? {
        guard let data = defaults?.data(forKey: key) else {
            return nil
        }

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601

        guard let stored = try? decoder.decode(Stored.self, from: data) else {
            return nil
        }

        // Step counts reset at midnight, so yesterday's total must not be shown
        // as today's. Location and parking stay valid across the boundary.
        let sameDay = calendar.isDate(
            stored.generatedAt,
            inSameDayAs: now
        )

        return DailyGlanceData(
            generatedAt: stored.generatedAt,
            locationAuthorization: authorization(from: stored.locationAuthorization),
            currentLocationName: stored.currentLocationName,
            latitude: stored.latitude,
            longitude: stored.longitude,
            altitudeMeters: stored.altitudeMeters,
            // Sun times are recomputed from the coordinates on the first clock
            // tick, so there is nothing worth persisting.
            sunrise: nil,
            sunset: nil,
            daylightRemaining: nil,
            parkingLatitude: stored.parkingLatitude,
            parkingLongitude: stored.parkingLongitude,
            parkingDistanceMeters: nil,
            parkingSavedAt: stored.parkingSavedAt,
            stepsToday: sameDay ? stored.stepsToday : nil
        )
    }

    static func save(
        _ data: DailyGlanceData,
        to defaults: UserDefaults? = GlanceSharedStorage.sharedDefaults
    ) {
        let stored = Stored(
            generatedAt: data.generatedAt,
            locationAuthorization: string(from: data.locationAuthorization),
            currentLocationName: data.currentLocationName,
            latitude: data.latitude,
            longitude: data.longitude,
            altitudeMeters: data.altitudeMeters,
            parkingLatitude: data.parkingLatitude,
            parkingLongitude: data.parkingLongitude,
            parkingSavedAt: data.parkingSavedAt,
            stepsToday: data.stepsToday
        )

        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601

        guard let encoded = try? encoder.encode(stored) else {
            return
        }

        defaults?.set(encoded, forKey: key)
    }

    private static func string(
        from authorization: GlanceLocationAuthorization
    ) -> String {
        switch authorization {
        case .notDetermined: return "notDetermined"
        case .authorized: return "authorized"
        case .denied: return "denied"
        case .restricted: return "restricted"
        case .unavailable: return "unavailable"
        }
    }

    private static func authorization(
        from raw: String
    ) -> GlanceLocationAuthorization {
        switch raw {
        case "authorized": return .authorized
        case "denied": return .denied
        case "restricted": return .restricted
        case "unavailable": return .unavailable
        default: return .notDetermined
        }
    }
}
