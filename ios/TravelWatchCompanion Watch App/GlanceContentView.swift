import SwiftUI

/// Pure rendering of a single `GlanceData` snapshot, split out of
/// `ContentView` so it can be driven by mock data in SwiftUI Previews
/// without touching the live snapshot/daily stores.
struct GlanceContentView: View {
    @Environment(\.openURL) private var openURL

    let glance: GlanceData
    let canRecordParking: Bool
    let onSaveParking: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            headerView

            glanceBody
        }
    }

    @ViewBuilder
    private var glanceBody: some View {
        switch glance.mode {
        case .unavailable:
            unavailableView

        case .travel, .daily, .stale:
            // No "Trip" row: the header already carries the trip, and on a 46mm
            // face the first screen only fits about four lines. Repeating it
            // there pushed every live metric below the fold.
            metricRow(
                title: WatchStrings.text("location"),
                value: formatLocation(glance)
            )

            metricRow(
                title: WatchStrings.text("altitude"),
                value: formatAltitude(glance.altitudeMeters)
            )

            metricRow(
                title: WatchStrings.text("weather"),
                value: formatTemperature(
                    glance.temperatureCelsius
                )
            )

            metricRow(
                title: WatchStrings.text("sunset"),
                value: formatTime(glance.sunset)
            )

            metricRow(
                title: WatchStrings.text("daylight"),
                value: formatDuration(glance.daylightRemaining)
            )

            Divider()

            metricRow(
                title: WatchStrings.text("steps"),
                value: formatSteps(glance.stepsToday)
            )

            metricRow(
                title: WatchStrings.text("car"),
                value: formatParking(glance)
            )

            parkingControls

            Divider()

            metricRow(
                title: WatchStrings.text("updated"),
                value: formatTime(glance.lastUpdatedAt)
            )
        }
    }

    private var headerView: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title(for: glance))
                .font(.caption2.weight(.semibold))
                .foregroundStyle(.secondary)
                .textCase(.uppercase)

            // In Daily mode the title is the mode name, so it would simply
            // repeat the label above it. The subtitle is dropped entirely
            // because it is the same place the Location row already shows.
            if glance.title != title(for: glance) {
                Text(glance.title)
                    .font(.headline)
                    .lineLimit(2)
                    .minimumScaleFactor(0.85)
            }

            if glance.isStale {
                Label(
                    WatchStrings.text("status.stale"),
                    systemImage: "exclamationmark.triangle"
                )
                .font(.caption2)
                .foregroundStyle(.secondary)
            }
        }
    }

    private var unavailableView: some View {
        VStack(alignment: .leading, spacing: 6) {
            Label(
                WatchStrings.text("status.waiting"),
                systemImage: "iphone"
            )
            .font(.body.weight(.semibold))

            Text(WatchStrings.text("status.waitingDetail"))
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
    }

    private func title(
        for glance: GlanceData
    ) -> String {
        switch glance.mode {
        case .daily, .unavailable:
            return WatchStrings.text("mode.daily")
        case .travel, .stale:
            return WatchStrings.text("app.title")
        }
    }

    private func formatLocation(
        _ glance: GlanceData
    ) -> String {
        if let locationName = glance.currentLocationName {
            return locationName
        }

        if let latitude = glance.latitude,
           let longitude = glance.longitude {
            return String(
                format: "%.4f, %.4f",
                latitude,
                longitude
            )
        }

        switch glance.locationAuthorization {
        case .authorized:
            return WatchStrings.text("value.unavailable")
        case .notDetermined:
            return WatchStrings.text("location.permissionNeeded")
        case .denied:
            return WatchStrings.text("location.permissionDenied")
        case .restricted:
            return WatchStrings.text("location.permissionRestricted")
        case .unavailable:
            return WatchStrings.text("location.unavailable")
        }
    }

    private func metricRow(
        title: String,
        value: String
    ) -> some View {
        HStack(alignment: .firstTextBaseline, spacing: 8) {
            Text(title)
                .font(.caption2)
                .foregroundStyle(.secondary)

            Spacer(minLength: 6)

            Text(value)
                .font(.body.weight(.semibold))
                .multilineTextAlignment(.trailing)
                .lineLimit(2)
                .minimumScaleFactor(0.8)
        }
    }

    private var parkingControls: some View {
        VStack(alignment: .leading, spacing: 6) {
            Button(
                action: onSaveParking,
                label: {
                    Label(
                        WatchStrings.text("parking.save"),
                        systemImage: "parkingsign.circle"
                    )
                }
            )
            .disabled(!canRecordParking)

            Button(
                action: {
                    openParkingDirections(glance)
                },
                label: {
                    Label(
                        WatchStrings.text("parking.directions"),
                        systemImage: "map"
                    )
                }
            )
            .disabled(!hasParkingCoordinate(glance))
        }
    }

    private func hasParkingCoordinate(
        _ glance: GlanceData
    ) -> Bool {
        glance.parkingLatitude != nil &&
            glance.parkingLongitude != nil
    }

    /// Rounded, locale-aware measurement text. `.naturalScale` converts to the
    /// region's own system, so an American traveller sees feet and Fahrenheit
    /// rather than the metric values the snapshot happens to carry.
    private func localizedMeasurement<T: Dimension>(
        _ value: Double,
        _ unit: T
    ) -> String {
        let formatter = MeasurementFormatter()
        formatter.unitOptions = .naturalScale
        formatter.numberFormatter.maximumFractionDigits = 0

        return formatter.string(
            from: Measurement(value: value, unit: unit)
        )
    }

    private func formatAltitude(
        _ meters: Double?
    ) -> String {
        guard let meters else {
            return WatchStrings.text("value.unavailable")
        }

        return localizedMeasurement(meters, UnitLength.meters)
    }

    private func formatTemperature(
        _ celsius: Double?
    ) -> String {
        guard let celsius else {
            return WatchStrings.text("value.unavailable")
        }

        return localizedMeasurement(celsius, UnitTemperature.celsius)
    }

    private func formatTime(
        _ date: Date?
    ) -> String {
        guard let date else {
            return WatchStrings.text("value.unavailable")
        }

        return date.formatted(
            date: .omitted,
            time: .shortened
        )
    }

    private func formatDuration(
        _ duration: TimeInterval?
    ) -> String {
        guard let duration, duration > 0 else {
            return WatchStrings.text("value.unavailable")
        }

        let totalMinutes = Int(
            duration / 60
        )

        return WatchStrings.format(
            "duration.hoursMinutes",
            totalMinutes / 60,
            totalMinutes % 60
        )
    }

    private func formatSteps(
        _ value: Int?
    ) -> String {
        guard let value else {
            return WatchStrings.text("value.unavailable")
        }

        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal

        return formatter.string(
            from: NSNumber(value: value)
        ) ?? "\(value)"
    }

    private func formatParking(
        _ glance: GlanceData
    ) -> String {
        guard let distance = glance.parkingDistanceMeters else {
            if hasParkingCoordinate(glance) {
                return WatchStrings.text("parking.saved")
            }

            return WatchStrings.text("parking.notSaved")
        }

        return localizedMeasurement(distance, UnitLength.meters)
    }

    private func openParkingDirections(
        _ glance: GlanceData
    ) {
        guard let latitude = glance.parkingLatitude,
              let longitude = glance.parkingLongitude,
              let url = URL(
                string: "http://maps.apple.com/?daddr=\(latitude),\(longitude)"
              ) else {
            return
        }

        openURL(url)
    }
}

#if DEBUG
/// Mock `GlanceData` fixtures for SwiftUI Previews only.
/// Not referenced by the live runtime.
private enum GlanceContentPreviewData {
    static let referenceDate = Date(timeIntervalSince1970: 1_750_000_000)

    static let travel = GlanceData(
        mode: .travel,
        title: "Kyoto Trip · Day 3",
        subtitle: "Arashiyama Bamboo Grove",
        currentLocationName: "Arashiyama Bamboo Grove",
        locationAuthorization: .authorized,
        latitude: 35.0094,
        longitude: 135.6717,
        altitudeMeters: 62,
        temperatureCelsius: 24,
        weatherSummary: "clear",
        sunrise: referenceDate.addingTimeInterval(-3600 * 6),
        sunset: referenceDate.addingTimeInterval(3600 * 3),
        daylightRemaining: 3600 * 3,
        parkingLatitude: 35.0102,
        parkingLongitude: 135.6725,
        parkingDistanceMeters: 240,
        parkingSavedAt: referenceDate.addingTimeInterval(-1800),
        stepsToday: 6_842,
        lastUpdatedAt: referenceDate,
        isStale: false,
        warnings: []
    )

    static let daily = GlanceData(
        mode: .daily,
        title: "Daily Glance",
        subtitle: "Home",
        currentLocationName: "Home",
        locationAuthorization: .authorized,
        latitude: 37.3349,
        longitude: -122.0090,
        altitudeMeters: 18,
        temperatureCelsius: nil,
        weatherSummary: nil,
        sunrise: referenceDate.addingTimeInterval(-3600 * 5),
        sunset: referenceDate.addingTimeInterval(3600 * 4),
        daylightRemaining: 3600 * 4,
        parkingLatitude: nil,
        parkingLongitude: nil,
        parkingDistanceMeters: nil,
        parkingSavedAt: nil,
        stepsToday: 2_140,
        lastUpdatedAt: referenceDate,
        isStale: false,
        warnings: []
    )

    static let stale = GlanceData(
        mode: .stale,
        title: "Kyoto Trip · Day 3",
        subtitle: "Arashiyama Bamboo Grove",
        currentLocationName: "Arashiyama Bamboo Grove",
        locationAuthorization: .authorized,
        latitude: 35.0094,
        longitude: 135.6717,
        altitudeMeters: 62,
        temperatureCelsius: 24,
        weatherSummary: "clear",
        sunrise: referenceDate.addingTimeInterval(-3600 * 6),
        sunset: referenceDate.addingTimeInterval(3600 * 3),
        daylightRemaining: 3600 * 3,
        parkingLatitude: 35.0102,
        parkingLongitude: 135.6725,
        parkingDistanceMeters: 240,
        parkingSavedAt: referenceDate.addingTimeInterval(-1800),
        stepsToday: 6_842,
        lastUpdatedAt: referenceDate.addingTimeInterval(-3600 * 5),
        isStale: true,
        warnings: [.staleSnapshot]
    )

    static let unavailable = GlanceData.unavailable(at: referenceDate)

    static let noLocationPermission = GlanceData(
        mode: .daily,
        title: "Daily Glance",
        subtitle: nil,
        currentLocationName: nil,
        locationAuthorization: .denied,
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
        lastUpdatedAt: referenceDate,
        isStale: false,
        warnings: [.locationPermissionDenied]
    )

    static let parkingSaved = GlanceData(
        mode: .daily,
        title: "Daily Glance",
        subtitle: "Downtown Garage",
        currentLocationName: "Downtown Garage",
        locationAuthorization: .authorized,
        latitude: 37.7749,
        longitude: -122.4194,
        altitudeMeters: 12,
        temperatureCelsius: nil,
        weatherSummary: nil,
        sunrise: referenceDate.addingTimeInterval(-3600 * 5),
        sunset: referenceDate.addingTimeInterval(3600 * 4),
        daylightRemaining: 3600 * 4,
        parkingLatitude: 37.7751,
        parkingLongitude: -122.4198,
        parkingDistanceMeters: nil,
        parkingSavedAt: referenceDate.addingTimeInterval(-600),
        stepsToday: 980,
        lastUpdatedAt: referenceDate,
        isStale: false,
        warnings: []
    )

    static let noParkingSaved = GlanceData(
        mode: .daily,
        title: "Daily Glance",
        subtitle: "Home",
        currentLocationName: "Home",
        locationAuthorization: .authorized,
        latitude: 37.3349,
        longitude: -122.0090,
        altitudeMeters: 18,
        temperatureCelsius: nil,
        weatherSummary: nil,
        sunrise: referenceDate.addingTimeInterval(-3600 * 5),
        sunset: referenceDate.addingTimeInterval(3600 * 4),
        daylightRemaining: 3600 * 4,
        parkingLatitude: nil,
        parkingLongitude: nil,
        parkingDistanceMeters: nil,
        parkingSavedAt: nil,
        stepsToday: 2_140,
        lastUpdatedAt: referenceDate,
        isStale: false,
        warnings: []
    )
}

#Preview("Travel Mode") {
    ScrollView {
        GlanceContentView(
            glance: GlanceContentPreviewData.travel,
            canRecordParking: true,
            onSaveParking: {}
        )
        .padding()
    }
}

#Preview("Daily Mode") {
    ScrollView {
        GlanceContentView(
            glance: GlanceContentPreviewData.daily,
            canRecordParking: true,
            onSaveParking: {}
        )
        .padding()
    }
}

#Preview("Stale Mode") {
    ScrollView {
        GlanceContentView(
            glance: GlanceContentPreviewData.stale,
            canRecordParking: true,
            onSaveParking: {}
        )
        .padding()
    }
}

#Preview("Unavailable / No Permission") {
    ScrollView {
        GlanceContentView(
            glance: GlanceContentPreviewData.unavailable,
            canRecordParking: false,
            onSaveParking: {}
        )
        .padding()
    }
}

#Preview("Daily · Location Permission Denied") {
    ScrollView {
        GlanceContentView(
            glance: GlanceContentPreviewData.noLocationPermission,
            canRecordParking: false,
            onSaveParking: {}
        )
        .padding()
    }
}

#Preview("Parking Saved") {
    ScrollView {
        GlanceContentView(
            glance: GlanceContentPreviewData.parkingSaved,
            canRecordParking: true,
            onSaveParking: {}
        )
        .padding()
    }
}

#Preview("No Parking Saved") {
    ScrollView {
        GlanceContentView(
            glance: GlanceContentPreviewData.noParkingSaved,
            canRecordParking: true,
            onSaveParking: {}
        )
        .padding()
    }
}
#endif
