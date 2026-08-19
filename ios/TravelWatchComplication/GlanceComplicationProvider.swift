import WidgetKit

struct GlanceComplicationEntry: TimelineEntry {
    let date: Date
    let payload: GlanceWidgetPayload?
}

struct GlanceComplicationProvider: TimelineProvider {
    /// How far ahead to schedule, and how finely. Daylight-remaining changes
    /// by the minute but nobody reads a watch face that precisely, and every
    /// entry costs against the widget's refresh budget.
    private static let entryInterval: TimeInterval = 15 * 60
    private static let horizon: TimeInterval = 6 * 60 * 60

    func placeholder(
        in context: Context
    ) -> GlanceComplicationEntry {
        GlanceComplicationEntry(
            date: Date(),
            payload: nil
        )
    }

    func getSnapshot(
        in context: Context,
        completion: @escaping (GlanceComplicationEntry) -> Void
    ) {
        completion(
            GlanceComplicationEntry(
                date: Date(),
                payload: loadPayload()
            )
        )
    }

    func getTimeline(
        in context: Context,
        completion: @escaping (Timeline<GlanceComplicationEntry>) -> Void
    ) {
        let now = Date()
        let payload = loadPayload()

        var dates: [Date] = []
        var cursor = now

        while cursor < now.addingTimeInterval(Self.horizon) {
            dates.append(cursor)
            cursor = cursor.addingTimeInterval(Self.entryInterval)
        }

        // Sunset is the one moment the face visibly changes meaning, so pin an
        // entry to it rather than letting it land mid-interval.
        if let sunset = payload?.sunset,
           sunset > now,
           sunset < now.addingTimeInterval(Self.horizon) {
            dates.append(sunset)
            dates.sort()
        }

        let entries = dates.map {
            GlanceComplicationEntry(date: $0, payload: payload)
        }

        completion(
            Timeline(
                entries: entries,
                policy: .after(now.addingTimeInterval(Self.horizon))
            )
        )
    }

    private func loadPayload() -> GlanceWidgetPayload? {
        let payload = GlanceSharedStorage.loadPayload()

        // Match the language the user picked in the iPhone app.
        if let language = payload?.language {
            WatchStrings.appLanguageOverride = language
        }

        return payload
    }
}
