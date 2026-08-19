import Foundation

enum GlanceLocationAuthorization: Equatable {
    case notDetermined
    case authorized
    case denied
    case restricted
    case unavailable
}

struct DailyGlanceData: Equatable {
    let generatedAt: Date
    let locationAuthorization: GlanceLocationAuthorization
    let currentLocationName: String?
    let latitude: Double?
    let longitude: Double?
    let altitudeMeters: Double?
    let sunrise: Date?
    let sunset: Date?
    let daylightRemaining: TimeInterval?
    let parkingLatitude: Double?
    let parkingLongitude: Double?
    let parkingDistanceMeters: Double?
    let parkingSavedAt: Date?
    let stepsToday: Int?
    /// Barometric pressure and which way it is heading. Trend is nil when
    /// steady or when there is not yet enough history to call it.
    let pressureKPa: Double?
    let pressureFalling: Bool?

    init(
        generatedAt: Date,
        locationAuthorization: GlanceLocationAuthorization,
        currentLocationName: String?,
        latitude: Double?,
        longitude: Double?,
        altitudeMeters: Double?,
        sunrise: Date?,
        sunset: Date?,
        daylightRemaining: TimeInterval?,
        parkingLatitude: Double?,
        parkingLongitude: Double?,
        parkingDistanceMeters: Double?,
        parkingSavedAt: Date?,
        stepsToday: Int?,
        pressureKPa: Double? = nil,
        pressureFalling: Bool? = nil
    ) {
        self.generatedAt = generatedAt
        self.locationAuthorization = locationAuthorization
        self.currentLocationName = currentLocationName
        self.latitude = latitude
        self.longitude = longitude
        self.altitudeMeters = altitudeMeters
        self.sunrise = sunrise
        self.sunset = sunset
        self.daylightRemaining = daylightRemaining
        self.parkingLatitude = parkingLatitude
        self.parkingLongitude = parkingLongitude
        self.parkingDistanceMeters = parkingDistanceMeters
        self.parkingSavedAt = parkingSavedAt
        self.stepsToday = stepsToday
        self.pressureKPa = pressureKPa
        self.pressureFalling = pressureFalling
    }

    nonisolated func updatingPressure(
        kilopascals: Double?,
        falling: Bool?
    ) -> DailyGlanceData {
        DailyGlanceData(
            generatedAt: Date(),
            locationAuthorization: locationAuthorization,
            currentLocationName: currentLocationName,
            latitude: latitude,
            longitude: longitude,
            altitudeMeters: altitudeMeters,
            sunrise: sunrise,
            sunset: sunset,
            daylightRemaining: daylightRemaining,
            parkingLatitude: parkingLatitude,
            parkingLongitude: parkingLongitude,
            parkingDistanceMeters: parkingDistanceMeters,
            parkingSavedAt: parkingSavedAt,
            stepsToday: stepsToday,
            pressureKPa: kilopascals,
            pressureFalling: falling
        )
    }

    nonisolated static func empty(
        at date: Date = Date()
    ) -> DailyGlanceData {
        DailyGlanceData(
            generatedAt: date,
            locationAuthorization: .notDetermined,
            currentLocationName: nil,
            latitude: nil,
            longitude: nil,
            altitudeMeters: nil,
            sunrise: nil,
            sunset: nil,
            daylightRemaining: nil,
            parkingLatitude: nil,
            parkingLongitude: nil,
            parkingDistanceMeters: nil,
            parkingSavedAt: nil,
            stepsToday: nil,
            pressureKPa: nil,
            pressureFalling: nil
        )
    }

    nonisolated func updatingClock(
        at date: Date = Date()
    ) -> DailyGlanceData {
        DailyGlanceData(
            generatedAt: date,
            locationAuthorization: locationAuthorization,
            currentLocationName: currentLocationName,
            latitude: latitude,
            longitude: longitude,
            altitudeMeters: altitudeMeters,
            sunrise: sunrise,
            sunset: sunset,
            daylightRemaining: daylightRemaining,
            parkingLatitude: parkingLatitude,
            parkingLongitude: parkingLongitude,
            parkingDistanceMeters: parkingDistanceMeters,
            parkingSavedAt: parkingSavedAt,
            stepsToday: stepsToday,
            pressureKPa: pressureKPa,
            pressureFalling: pressureFalling
        )
    }

    nonisolated func updatingLocation(
        authorization: GlanceLocationAuthorization,
        latitude: Double?,
        longitude: Double?,
        altitudeMeters: Double?
    ) -> DailyGlanceData {
        DailyGlanceData(
            generatedAt: Date(),
            locationAuthorization: authorization,
            currentLocationName: currentLocationName,
            latitude: latitude,
            longitude: longitude,
            altitudeMeters: altitudeMeters,
            sunrise: sunrise,
            sunset: sunset,
            daylightRemaining: daylightRemaining,
            parkingLatitude: parkingLatitude,
            parkingLongitude: parkingLongitude,
            parkingDistanceMeters: parkingDistanceMeters,
            parkingSavedAt: parkingSavedAt,
            stepsToday: stepsToday,
            pressureKPa: pressureKPa,
            pressureFalling: pressureFalling
        )
    }

    nonisolated func updatingParking(
        latitude: Double?,
        longitude: Double?,
        distanceMeters: Double?,
        savedAt: Date?
    ) -> DailyGlanceData {
        DailyGlanceData(
            generatedAt: Date(),
            locationAuthorization: locationAuthorization,
            currentLocationName: currentLocationName,
            latitude: self.latitude,
            longitude: self.longitude,
            altitudeMeters: altitudeMeters,
            sunrise: sunrise,
            sunset: sunset,
            daylightRemaining: daylightRemaining,
            parkingLatitude: latitude,
            parkingLongitude: longitude,
            parkingDistanceMeters: distanceMeters,
            parkingSavedAt: savedAt,
            stepsToday: stepsToday,
            pressureKPa: pressureKPa,
            pressureFalling: pressureFalling
        )
    }

    nonisolated func updatingSun(
        sunrise: Date?,
        sunset: Date?,
        daylightRemaining: TimeInterval?
    ) -> DailyGlanceData {
        DailyGlanceData(
            generatedAt: Date(),
            locationAuthorization: locationAuthorization,
            currentLocationName: currentLocationName,
            latitude: latitude,
            longitude: longitude,
            altitudeMeters: altitudeMeters,
            sunrise: sunrise,
            sunset: sunset,
            daylightRemaining: daylightRemaining,
            parkingLatitude: parkingLatitude,
            parkingLongitude: parkingLongitude,
            parkingDistanceMeters: parkingDistanceMeters,
            parkingSavedAt: parkingSavedAt,
            stepsToday: stepsToday,
            pressureKPa: pressureKPa,
            pressureFalling: pressureFalling
        )
    }

    nonisolated func updatingSteps(
        _ stepsToday: Int?
    ) -> DailyGlanceData {
        DailyGlanceData(
            generatedAt: Date(),
            locationAuthorization: locationAuthorization,
            currentLocationName: currentLocationName,
            latitude: latitude,
            longitude: longitude,
            altitudeMeters: altitudeMeters,
            sunrise: sunrise,
            sunset: sunset,
            daylightRemaining: daylightRemaining,
            parkingLatitude: parkingLatitude,
            parkingLongitude: parkingLongitude,
            parkingDistanceMeters: parkingDistanceMeters,
            parkingSavedAt: parkingSavedAt,
            stepsToday: stepsToday,
            pressureKPa: pressureKPa,
            pressureFalling: pressureFalling
        )
    }

    nonisolated func updatingLocationName(
        _ currentLocationName: String?
    ) -> DailyGlanceData {
        DailyGlanceData(
            generatedAt: Date(),
            locationAuthorization: locationAuthorization,
            currentLocationName: currentLocationName,
            latitude: latitude,
            longitude: longitude,
            altitudeMeters: altitudeMeters,
            sunrise: sunrise,
            sunset: sunset,
            daylightRemaining: daylightRemaining,
            parkingLatitude: parkingLatitude,
            parkingLongitude: parkingLongitude,
            parkingDistanceMeters: parkingDistanceMeters,
            parkingSavedAt: parkingSavedAt,
            stepsToday: stepsToday,
            pressureKPa: pressureKPa,
            pressureFalling: pressureFalling
        )
    }
}
