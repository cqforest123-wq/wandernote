import Foundation

enum GlanceMode: Equatable {
    case travel
    case daily
    case stale
    case unavailable
}

struct GlanceData: Equatable {
    let mode: GlanceMode
    let title: String
    let subtitle: String?
    let currentLocationName: String?
    let latitude: Double?
    let longitude: Double?
    let altitudeMeters: Double?
    let temperatureCelsius: Double?
    let weatherSummary: String?
    let sunrise: Date?
    let sunset: Date?
    let daylightRemaining: TimeInterval?
    let parkingLatitude: Double?
    let parkingLongitude: Double?
    let parkingDistanceMeters: Double?
    let parkingSavedAt: Date?
    let stepsToday: Int?
    let lastUpdatedAt: Date?
    let isStale: Bool
    let warnings: [GlanceStatusLine]

    static func unavailable(
        at date: Date
    ) -> GlanceData {
        GlanceData(
            mode: .unavailable,
            title: "Daily Glance",
            subtitle: nil,
            currentLocationName: nil,
            latitude: nil,
            longitude: nil,
            altitudeMeters: nil,
            temperatureCelsius: nil,
            weatherSummary: nil,
            sunrise: nil,
            sunset: nil,
            daylightRemaining: nil,
            parkingLatitude: nil,
            parkingLongitude: nil,
            parkingDistanceMeters: nil,
            parkingSavedAt: nil,
            stepsToday: nil,
            lastUpdatedAt: date,
            isStale: false,
            warnings: [.waitingForData]
        )
    }
}

enum GlanceStatusLine: Equatable {
    case waitingForData
    case staleSnapshot
}
