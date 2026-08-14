import Foundation
import WidgetKit

/// Publishes the flattened complication payload into the shared App Group.
///
/// The complication cannot read the Watch App's live stores, so every change
/// worth showing on the watch face has to be written out here. Writes are
/// deduplicated: `GlanceData` is recomputed once a minute by the app's
/// `TimelineView`, and asking WidgetKit to reload that often would get the
/// complication throttled by the system.
@MainActor
enum GlanceWidgetPayloadWriter {
    private static var lastWritten: GlanceWidgetPayload?

    static func write(
        from glance: GlanceData,
        language: String?
    ) {
        let payload = GlanceWidgetPayload(
            updatedAt: glance.lastUpdatedAt ?? Date(),
            tripName: glance.mode == .daily ? nil : glance.title,
            dayNumber: nil,
            placeName: glance.currentLocationName,
            temperatureCelsius: glance.temperatureCelsius,
            sunrise: glance.sunrise,
            sunset: glance.sunset,
            stepsToday: glance.stepsToday,
            parkingSavedAt: glance.parkingSavedAt,
            language: language
        )

        guard payload != lastWritten else {
            return
        }

        lastWritten = payload

        guard GlanceSharedStorage.savePayload(payload) else {
            return
        }

        WidgetCenter.shared.reloadAllTimelines()
    }
}
