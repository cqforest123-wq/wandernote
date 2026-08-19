import Foundation
import WatchKit

/// Keeps the glance warm between visits.
///
/// Without this the app only gathers data while it is on screen, so every
/// wrist-raise starts from the cache and fills in over the next few seconds
/// while you watch it happen. Each granted background window is spent taking a
/// fresh reading and writing it to the shared container, so the next launch —
/// and the complication — open on something current.
@MainActor
enum BackgroundRefreshScheduler {
    /// watchOS rations these hard. Asking much more often gets the requests
    /// dropped, and costs battery when it doesn't.
    static let interval: TimeInterval = 30 * 60

    static func scheduleNext(after interval: TimeInterval = Self.interval) {
        WKApplication.shared().scheduleBackgroundRefresh(
            withPreferredDate: Date().addingTimeInterval(interval),
            userInfo: nil
        ) { error in
            if let error {
                print("[WatchGlance] background refresh not scheduled: \(error)")
            }
        }
    }
}
