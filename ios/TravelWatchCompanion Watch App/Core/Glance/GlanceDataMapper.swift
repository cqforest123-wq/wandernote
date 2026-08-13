import Foundation

private enum GlanceMapperDiagnostics {
    static func log(_ message: @autoclosure () -> String) {
        #if DEBUG
        print("[WatchGlance] \(message())")
        #endif
    }
}

enum GlanceDataMapper {
    static func make(
        snapshot: OutdoorGlanceSnapshot?,
        availability: OutdoorGlanceSnapshotAvailability,
        dailyData: DailyGlanceData? = nil,
        at date: Date = Date()
    ) -> GlanceData {
        guard let snapshot else {
            if let dailyData {
                GlanceMapperDiagnostics.log(
                    "Daily fallback selected because no iPhone snapshot is available"
                )
                return makeDailyGlance(
                    dailyData,
                    at: date
                )
            }

            return GlanceData.unavailable(at: date)
        }

        let isStale = availability == .stale ||
            snapshot.isStale(at: date)
        let tripTitle = title(for: snapshot.trip)
        let locationName = snapshot.location?.name
        let mode: GlanceMode = isStale ? .stale : .travel

        if isStale {
            GlanceMapperDiagnostics.log(
                "stale travel snapshot selected"
            )
        }

        let resolvedLocation = mergedLocation(
            snapshotLocation: snapshot.location,
            locationName: locationName,
            dailyData: dailyData
        )
        let resolvedAltitude = snapshot.altitude?.meters ??
            dailyData?.altitudeMeters
        let resolvedSteps = snapshot.activity?.steps ??
            dailyData?.stepsToday

        if snapshot.altitude == nil {
            GlanceMapperDiagnostics.log(
                resolvedAltitude == nil
                    ? "travel snapshot missing altitude; watch local altitude also unavailable"
                    : "travel snapshot missing altitude; using watch local altitude"
            )
        }

        if snapshot.activity?.steps == nil {
            GlanceMapperDiagnostics.log(
                resolvedSteps == nil
                    ? "travel snapshot missing steps; watch local steps also unavailable"
                    : "travel snapshot missing steps; using watch local steps"
            )
        }

        return GlanceData(
            mode: mode,
            title: tripTitle ?? "WanderNote",
            subtitle: resolvedLocation.name,
            currentLocationName: resolvedLocation.name,
            locationAuthorization: resolvedLocation.authorization,
            latitude: resolvedLocation.latitude,
            longitude: resolvedLocation.longitude,
            altitudeMeters: resolvedAltitude,
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
            stepsToday: resolvedSteps,
            lastUpdatedAt: snapshot.generatedAt,
            isStale: isStale,
            warnings: isStale ? [.staleSnapshot] : []
        )
    }

    private static func mergedLocation(
        snapshotLocation: OutdoorGlanceLocation?,
        locationName: String?,
        dailyData: DailyGlanceData?
    ) -> (
        name: String?,
        latitude: Double?,
        longitude: Double?,
        authorization: GlanceLocationAuthorization
    ) {
        if let snapshotLocation {
            return (
                locationName,
                snapshotLocation.latitude,
                snapshotLocation.longitude,
                .authorized
            )
        }

        guard let dailyData else {
            GlanceMapperDiagnostics.log(
                "travel snapshot missing location; watch local location also unavailable"
            )
            return (nil, nil, nil, .unavailable)
        }

        GlanceMapperDiagnostics.log(
            dailyData.latitude == nil
                ? "travel snapshot missing location; watch local location also unavailable (authorization=\(dailyData.locationAuthorization))"
                : "travel snapshot missing location; using watch local location"
        )

        return (
            dailyData.currentLocationName,
            dailyData.latitude,
            dailyData.longitude,
            dailyData.locationAuthorization
        )
    }

    private static func makeDailyGlance(
        _ dailyData: DailyGlanceData,
        at date: Date
    ) -> GlanceData {
        GlanceData(
            mode: .daily,
            title: "Daily Glance",
            subtitle: dailyData.currentLocationName,
            currentLocationName: dailyData.currentLocationName,
            locationAuthorization: dailyData.locationAuthorization,
            latitude: dailyData.latitude,
            longitude: dailyData.longitude,
            altitudeMeters: dailyData.altitudeMeters,
            temperatureCelsius: nil,
            weatherSummary: nil,
            sunrise: dailyData.sunrise,
            sunset: dailyData.sunset,
            daylightRemaining: daylightRemaining(
                until: dailyData.sunset,
                from: date
            ) ?? dailyData.daylightRemaining,
            parkingLatitude: dailyData.parkingLatitude,
            parkingLongitude: dailyData.parkingLongitude,
            parkingDistanceMeters: dailyData.parkingDistanceMeters,
            parkingSavedAt: dailyData.parkingSavedAt,
            stepsToday: dailyData.stepsToday,
            lastUpdatedAt: dailyData.generatedAt,
            isStale: false,
            warnings: dailyWarnings(for: dailyData)
        )
    }

    private static func dailyWarnings(
        for data: DailyGlanceData
    ) -> [GlanceStatusLine] {
        switch data.locationAuthorization {
        case .authorized:
            return []
        case .notDetermined:
            return [.locationPermissionNotDetermined]
        case .denied:
            return [.locationPermissionDenied]
        case .restricted:
            return [.locationPermissionRestricted]
        case .unavailable:
            return [.locationUnavailable]
        }
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
