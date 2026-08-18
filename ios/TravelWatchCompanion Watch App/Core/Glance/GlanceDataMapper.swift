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
        // Match the language the user picked on the iPhone. Nil leaves the
        // watch on its own system locale, which is the right default.
        if let language = snapshot?.language {
            WatchStrings.appLanguageOverride = language
        }

        // A snapshot with no trip carries nothing the watch cannot measure
        // itself, and it is persisted across launches — treating it as travel
        // data would lock the watch out of Daily mode forever.
        guard let snapshot, snapshot.trip != nil else {
            if let dailyData {
                GlanceMapperDiagnostics.log(
                    snapshot == nil
                        ? "Daily fallback selected because no iPhone snapshot is available"
                        : "Daily fallback selected because the iPhone snapshot has no trip"
                )
                // Carry the phone's unit preference into Daily mode too:
                // without it the watch fell back to guessing and showed feet
                // in Chengdu even while a snapshot was sitting right there.
                return makeDailyGlance(
                    dailyData,
                    at: date,
                    usesMetric: snapshot?.usesMetric
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

        // The iPhone never computes sun times or parking — both are measured on
        // the watch. Without these fallbacks every travel-mode glance shows
        // "unavailable" for sunset/daylight and treats parking as unsaved,
        // which also permanently disables the "Back to Parking" button.
        let resolvedSunrise = snapshot.sun?.sunriseAt ?? dailyData?.sunrise
        let resolvedSunset = snapshot.sun?.sunsetAt ?? dailyData?.sunset
        let resolvedParkingLatitude = snapshot.parking?.latitude ??
            dailyData?.parkingLatitude
        let resolvedParkingLongitude = snapshot.parking?.longitude ??
            dailyData?.parkingLongitude
        let resolvedParkingDistance = snapshot.parking?.distanceMeters ??
            dailyData?.parkingDistanceMeters
        let resolvedParkingSavedAt = snapshot.parking?.savedAt ??
            dailyData?.parkingSavedAt

        if snapshot.sun == nil {
            GlanceMapperDiagnostics.log(
                resolvedSunset == nil
                    ? "travel snapshot missing sun times; watch local sun times also unavailable"
                    : "travel snapshot missing sun times; using watch local sun times"
            )
        }

        if snapshot.parking == nil {
            GlanceMapperDiagnostics.log(
                resolvedParkingLatitude == nil
                    ? "travel snapshot missing parking; no parking saved on the watch either"
                    : "travel snapshot missing parking; using watch local parking"
            )
        }

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
            sunrise: resolvedSunrise,
            sunset: resolvedSunset,
            daylightRemaining: daylightRemaining(
                until: resolvedSunset,
                from: date
            ) ?? dailyData?.daylightRemaining,
            parkingLatitude: resolvedParkingLatitude,
            parkingLongitude: resolvedParkingLongitude,
            parkingDistanceMeters: resolvedParkingDistance,
            parkingSavedAt: resolvedParkingSavedAt,
            stepsToday: resolvedSteps,
            lastUpdatedAt: snapshot.generatedAt,
            isStale: isStale,
            warnings: isStale ? [.staleSnapshot] : [],
            todaySpendText: snapshot.todaySpendText,
            pressureText: formatPressure(dailyData?.pressureKPa),
            pressureFalling: dailyData?.pressureFalling,
            usesMetric: snapshot.usesMetric
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
        // Prefer where the wearer actually is. The snapshot's location is only
        // the trip's destination — useful as a fallback, but it never moves, so
        // showing it as "Location" while the watch knows better is misleading.
        if let dailyData,
           dailyData.latitude != nil,
           dailyData.longitude != nil {
            return (
                dailyData.currentLocationName ?? locationName,
                dailyData.latitude,
                dailyData.longitude,
                dailyData.locationAuthorization
            )
        }

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
        at date: Date,
        usesMetric: Bool? = nil
    ) -> GlanceData {
        GlanceData(
            mode: .daily,
            title: WatchStrings.text("mode.daily"),
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
            warnings: dailyWarnings(for: dailyData),
            todaySpendText: nil,
            pressureText: formatPressure(dailyData.pressureKPa),
            pressureFalling: dailyData.pressureFalling,
            usesMetric: usesMetric
        )
    }

    /// hPa is what weather reports use; the sensor gives kPa.
    private static func formatPressure(_ kPa: Double?) -> String? {
        guard let kPa, kPa > 0 else {
            return nil
        }

        return "\(Int((kPa * 10).rounded())) hPa"
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
