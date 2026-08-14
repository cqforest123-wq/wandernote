import SwiftUI
import WidgetKit

struct GlanceComplicationView: View {
    @Environment(\.widgetFamily) private var family

    let entry: GlanceComplicationEntry

    var body: some View {
        switch family {
        case .accessoryInline:
            Text(inlineText)

        case .accessoryCircular:
            circularView

        case .accessoryCorner:
            circularView
                .widgetLabel {
                    Text(cornerLabel)
                }

        default:
            rectangularView
        }
    }

    // MARK: - Families

    private var circularView: some View {
        Group {
            if let fraction = entry.payload?.daylightFraction(at: entry.date),
               let remaining = daylightText {
                Gauge(value: fraction) {
                    Image(systemName: "sun.horizon")
                } currentValueLabel: {
                    Text(remaining)
                        .minimumScaleFactor(0.6)
                }
                .gaugeStyle(.accessoryCircular)
            } else {
                Image(systemName: "sun.horizon")
                    .font(.title3)
            }
        }
    }

    private var rectangularView: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(headline)
                .font(.headline)
                .lineLimit(1)

            Text(daylineText)
                .font(.caption2)
                .foregroundStyle(.secondary)
                .lineLimit(1)

            if let parking = parkingText {
                Text(parking)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }
        }
        .frame(
            maxWidth: .infinity,
            alignment: .leading
        )
    }

    // MARK: - Text

    private var headline: String {
        entry.payload?.tripName
            ?? entry.payload?.placeName
            ?? WatchStrings.text("mode.daily")
    }

    /// After sunset there is no daylight left to count down, so fall back to
    /// the sunset time rather than showing a zero that looks like a bug.
    private var daylineText: String {
        if let remaining = daylightText {
            return "\(WatchStrings.text("daylight")) \(remaining)"
        }

        if let sunset = entry.payload?.sunset {
            return "\(WatchStrings.text("sunset")) \(shortTime(sunset))"
        }

        return WatchStrings.text("value.unavailable")
    }

    private var inlineText: String {
        if let remaining = daylightText {
            return "\(WatchStrings.text("daylight")) \(remaining)"
        }

        if let sunset = entry.payload?.sunset {
            return "\(WatchStrings.text("sunset")) \(shortTime(sunset))"
        }

        return WatchStrings.text("app.title")
    }

    private var cornerLabel: String {
        guard let sunset = entry.payload?.sunset else {
            return WatchStrings.text("app.title")
        }

        return shortTime(sunset)
    }

    private var daylightText: String? {
        guard let remaining = entry.payload?.daylightRemaining(at: entry.date) else {
            return nil
        }

        let totalMinutes = Int(remaining / 60)

        return WatchStrings.format(
            "duration.hoursMinutes",
            totalMinutes / 60,
            totalMinutes % 60
        )
    }

    /// Deliberately a duration, not a distance. The complication cannot read
    /// live location, so a distance would freeze at whatever it was when the
    /// app was last open — "parked 1h20m ago" stays true either way.
    private var parkingText: String? {
        guard let savedAt = entry.payload?.parkingSavedAt else {
            return nil
        }

        let elapsed = entry.date.timeIntervalSince(savedAt)

        guard elapsed >= 0 else {
            return nil
        }

        let totalMinutes = Int(elapsed / 60)
        let duration = WatchStrings.format(
            "duration.hoursMinutes",
            totalMinutes / 60,
            totalMinutes % 60
        )

        return WatchStrings.format("parking.elapsed", duration)
    }

    private func shortTime(_ date: Date) -> String {
        date.formatted(
            date: .omitted,
            time: .shortened
        )
    }
}
