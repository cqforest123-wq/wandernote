import SwiftUI

struct ContentView: View {
    private let glance = MockOutdoorGlanceProvider.current()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 10) {
                Text(WatchStrings.text("app.title"))
                    .font(.headline)

                metricRow(
                    title: WatchStrings.text("location"),
                    value: glance.locationName
                )

                metricRow(
                    title: WatchStrings.text("altitude"),
                    value: "\(glance.altitudeMeters) m"
                )

                metricRow(
                    title: WatchStrings.text("sunset"),
                    value: glance.sun.sunsetTime
                )

                metricRow(
                    title: WatchStrings.text("daylight"),
                    value: glance.sun.daylightRemainingText
                )

                metricRow(
                    title: WatchStrings.text("steps"),
                    value: Self.formatSteps(glance.stepCount)
                )

                metricRow(
                    title: WatchStrings.text("car"),
                    value: "\(glance.parking.directionSymbol) \(glance.parking.distanceText)"
                )
            }
            .padding()
        }
    }

    private func metricRow(title: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title)
                .font(.caption2)
                .foregroundStyle(.secondary)
            Text(value)
                .font(.body)
                .fontWeight(.semibold)
        }
    }

    private static func formatSteps(_ value: Int) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        return formatter.string(from: NSNumber(value: value)) ?? "\(value)"
    }
}

#Preview {
    ContentView()
}
