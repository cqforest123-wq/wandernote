import Foundation

enum GlanceDataMapper {
    static func make(
        snapshot: OutdoorGlanceSnapshot?,
        availability: OutdoorGlanceSnapshotAvailability,
        at date: Date = Date()
    ) -> GlanceData {
        guard let snapshot else {
            return GlanceData.unavailable(at: date)
        }

        let isStale = availability == .stale ||
            snapshot.isStale(at: date)
        let tripTitle = title(for: snapshot.trip)
        let locationName = snapshot.location?.name
        let mode: GlanceMode = isStale ? .stale : .travel

        return GlanceData(
            mode: mode,
            title: tripTitle ?? "WanderNote",
            subtitle: locationName,
            currentLocationName: locationName,
            latitude: snapshot.location?.latitude,
            longitude: snapshot.location?.longitude,
            altitudeMeters: snapshot.altitude?.meters,
            temperatureCelsius: snapshot.weather?.temperatureCelsius,
            weatherSummary: snapshot.weather?.conditionCode,
            sunrise: snapshot.sun?.sunriseAt,
            sunset: snapshot.sun?.sunsetAt,
            daylightRemaining: daylightRemaining(
                until: snapshot.sun?.sunsetAt,
                from: date
            ),
            parkingLatitude: snapshot.parking?.latitude,
            parkingLongitude: snapshot.parking?.longitude,
            parkingDistanceMeters: snapshot.parking?.distanceMeters,
            parkingSavedAt: snapshot.parking?.savedAt,
            stepsToday: snapshot.activity?.steps,
            lastUpdatedAt: snapshot.generatedAt,
            isStale: isStale,
            warnings: isStale ? [.staleSnapshot] : []
        )
    }

    private static func title(
        for trip: OutdoorGlanceTrip?
    ) -> String? {
        guard let trip else {
            return nil
        }

        guard let dayNumber = trip.dayNumber else {
            return trip.name
        }

        return WatchStrings.format(
            "trip.dayFormat",
            trip.name,
            dayNumber
        )
    }

    private static func daylightRemaining(
        until sunset: Date?,
        from date: Date
    ) -> TimeInterval? {
        guard let sunset, sunset > date else {
            return nil
        }

        return sunset.timeIntervalSince(date)
    }
}
