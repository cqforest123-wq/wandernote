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
        VStack(alignment: .leading, spacing: 10) {
            Text(WatchStrings.text("app.title"))
                .font(.headline)

            switch store.availability(at: date) {
            case .unavailable:
                unavailableView

            case .fresh, .stale:
                if store.availability(at: date) == .stale {
                    Label(
                        WatchStrings.text("status.stale"),
                        systemImage: "exclamationmark.triangle"
                    )
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                }

                if let snapshot = store.snapshot {
                    snapshotView(snapshot, at: date)
                }
            }
        }
    }

    private var unavailableView: some View {
        VStack(alignment: .leading, spacing: 6) {
            Label(
                WatchStrings.text("status.waiting"),
                systemImage: "iphone"
            )
            .font(.body)
            .fontWeight(.semibold)

            Text(WatchStrings.text("status.waitingDetail"))
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
    }

    @ViewBuilder
    private func snapshotView(
        _ snapshot: OutdoorGlanceSnapshot,
        at date: Date
    ) -> some View {
        if let trip = snapshot.trip {
            metricRow(
                title: WatchStrings.text("trip"),
                value: tripTitle(trip)
            )
        }

        metricRow(
            title: WatchStrings.text("location"),
            value: snapshot.location?.name ??
                WatchStrings.text("value.unavailable")
        )

        metricRow(
            title: WatchStrings.text("altitude"),
            value: formatAltitude(snapshot.altitude?.meters)
        )

        metricRow(
            title: WatchStrings.text("weather"),
            value: formatTemperature(
                snapshot.weather?.temperatureCelsius
            )
        )

        metricRow(
            title: WatchStrings.text("sunset"),
            value: formatTime(snapshot.sun?.sunsetAt)
        )

        metricRow(
            title: WatchStrings.text("daylight"),
            value: formatDaylight(
                until: snapshot.sun?.sunsetAt,
                from: date
            )
        )

        metricRow(
            title: WatchStrings.text("steps"),
            value: formatSteps(snapshot.activity?.steps)
        )

        metricRow(
            title: WatchStrings.text("car"),
            value: formatParking(snapshot.parking)
        )

        metricRow(
            title: WatchStrings.text("updated"),
            value: formatTime(snapshot.generatedAt)
        )
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
                .font(.body)
                .fontWeight(.semibold)
        }
    }

    private func tripTitle(
        _ trip: OutdoorGlanceTrip
    ) -> String {
        guard let dayNumber = trip.dayNumber else {
            return trip.name
        }

        return WatchStrings.format(
            "trip.dayFormat",
            trip.name,
            dayNumber
        )
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

    private func formatDaylight(
        until sunset: Date?,
        from date: Date
    ) -> String {
        guard let sunset, sunset > date else {
            return WatchStrings.text("value.unavailable")
        }

        let totalMinutes = Int(
            sunset.timeIntervalSince(date) / 60
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
        _ parking: OutdoorGlanceParking?
    ) -> String {
        guard let parking,
              let distance = parking.distanceMeters else {
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

        guard let bearing = parking.bearingDegrees else {
            return distanceText
        }

        return "\(directionSymbol(for: bearing)) \(distanceText)"
    }

    private func directionSymbol(
        for bearing: Double
    ) -> String {
        let symbols = ["↑", "↗", "→", "↘", "↓", "↙", "←", "↖"]
        let normalized = bearing.truncatingRemainder(dividingBy: 360)
        let positive = normalized >= 0 ? normalized : normalized + 360
        let index = Int((positive + 22.5) / 45.0) % symbols.count

        return symbols[index]
    }
}
