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
            stepsToday: nil
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
            stepsToday: stepsToday
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
            stepsToday: stepsToday
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
            stepsToday: stepsToday
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
            stepsToday: stepsToday
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
            stepsToday: stepsToday
        )
    }
}
