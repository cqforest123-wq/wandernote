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
    let locationAuthorization: GlanceLocationAuthorization
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
    /// Already formatted by the iPhone, which owns the home currency and the
    /// per-currency decimal rules. Duplicating that money formatting in Swift
    /// would be a second place for it to drift.
    let todaySpendText: String?

    init(
        mode: GlanceMode,
        title: String,
        subtitle: String?,
        currentLocationName: String?,
        locationAuthorization: GlanceLocationAuthorization,
        latitude: Double?,
        longitude: Double?,
        altitudeMeters: Double?,
        temperatureCelsius: Double?,
        weatherSummary: String?,
        sunrise: Date?,
        sunset: Date?,
        daylightRemaining: TimeInterval?,
        parkingLatitude: Double?,
        parkingLongitude: Double?,
        parkingDistanceMeters: Double?,
        parkingSavedAt: Date?,
        stepsToday: Int?,
        lastUpdatedAt: Date?,
        isStale: Bool,
        warnings: [GlanceStatusLine],
        todaySpendText: String? = nil
    ) {
        self.mode = mode
        self.title = title
        self.subtitle = subtitle
        self.currentLocationName = currentLocationName
        self.locationAuthorization = locationAuthorization
        self.latitude = latitude
        self.longitude = longitude
        self.altitudeMeters = altitudeMeters
        self.temperatureCelsius = temperatureCelsius
        self.weatherSummary = weatherSummary
        self.sunrise = sunrise
        self.sunset = sunset
        self.daylightRemaining = daylightRemaining
        self.parkingLatitude = parkingLatitude
        self.parkingLongitude = parkingLongitude
        self.parkingDistanceMeters = parkingDistanceMeters
        self.parkingSavedAt = parkingSavedAt
        self.stepsToday = stepsToday
        self.lastUpdatedAt = lastUpdatedAt
        self.isStale = isStale
        self.warnings = warnings
        self.todaySpendText = todaySpendText
    }

    static func unavailable(
        at date: Date
    ) -> GlanceData {
        GlanceData(
            mode: .unavailable,
            title: WatchStrings.text("mode.daily"),
            subtitle: nil,
            currentLocationName: nil,
            locationAuthorization: .unavailable,
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
    case locationPermissionNotDetermined
    case locationPermissionDenied
    case locationPermissionRestricted
    case locationUnavailable
}
