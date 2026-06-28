import SwiftUI

struct ContentView: View {
    @EnvironmentObject private var store: OutdoorGlanceSnapshotStore

    var body: some View {
        TimelineView(.periodic(from: .now, by: 60)) { context in
            ScrollView {
                content(at: context.date)
                    .padding()
            }
        }
    }

    @ViewBuilder
    private func content(at date: Date) -> some View {
        let glance = GlanceDataMapper.make(
            snapshot: store.snapshot,
            availability: store.availability(at: date),
            at: date
        )

        VStack(alignment: .leading, spacing: 10) {
            Text(title(for: glance))
                .font(.headline)

            if glance.isStale {
                Label(
                    WatchStrings.text("status.stale"),
                    systemImage: "exclamationmark.triangle"
                )
                .font(.caption2)
                .foregroundStyle(.secondary)
            }

            glanceView(glance, at: date)
        }
    }

    @ViewBuilder
    private func glanceView(
        _ glance: GlanceData,
        at date: Date
    ) -> some View {
        switch glance.mode {
        case .unavailable:
            unavailableView

        case .travel, .daily, .stale:
            metricRow(
                title: WatchStrings.text("trip"),
                value: glance.title
            )

            metricRow(
                title: WatchStrings.text("location"),
                value: glance.currentLocationName ??
                    WatchStrings.text("value.unavailable")
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

            metricRow(
                title: WatchStrings.text("steps"),
                value: formatSteps(glance.stepsToday)
            )

            metricRow(
                title: WatchStrings.text("car"),
                value: formatParking(glance)
            )

            metricRow(
                title: WatchStrings.text("updated"),
                value: formatTime(glance.lastUpdatedAt)
            )
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
            return "Daily Glance"
        case .travel, .stale:
            return WatchStrings.text("app.title")
        }
    }

    private func metricRow(
        title: String,
        value: String
    ) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title)
                .font(.caption2)
                .foregroundStyle(.secondary)

            Text(value)
                .font(.body.weight(.semibold))
        }
    }

    private func formatAltitude(
        _ meters: Double?
    ) -> String {
        guard let meters else {
            return WatchStrings.text("value.unavailable")
        }

        return "\(Int(meters.rounded())) m"
    }

    private func formatTemperature(
        _ celsius: Double?
    ) -> String {
        guard let celsius else {
            return WatchStrings.text("value.unavailable")
        }

        return "\(Int(celsius.rounded()))°C"
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
            return WatchStrings.text("value.unavailable")
        }

        let distanceText: String

        if distance < 1_000 {
            distanceText = "\(Int(distance.rounded())) m"
        } else {
            distanceText = String(
                format: "%.1f km",
                distance / 1_000
            )
        }

        return distanceText
    }
}
