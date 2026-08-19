import SwiftUI
import WidgetKit

@main
struct TravelWatchComplicationBundle: WidgetBundle {
    var body: some Widget {
        GlanceComplication()
    }
}

struct GlanceComplication: Widget {
    static let kind = "TravelGlanceComplication"

    var body: some WidgetConfiguration {
        StaticConfiguration(
            kind: Self.kind,
            provider: GlanceComplicationProvider()
        ) { entry in
            GlanceComplicationView(entry: entry)
                .containerBackground(
                    .fill.tertiary,
                    for: .widget
                )
        }
        .configurationDisplayName(WatchStrings.text("app.title"))
        .description(WatchStrings.text("complication.description"))
        .supportedFamilies([
            .accessoryInline,
            .accessoryCircular,
            .accessoryCorner,
            .accessoryRectangular
        ])
    }
}
