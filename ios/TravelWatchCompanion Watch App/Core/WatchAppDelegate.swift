import Foundation
import WatchKit

/// Receives watchOS background refresh windows.
///
/// SwiftUI's `.backgroundTask(.appRefresh)` scene modifier would be tidier, but
/// it defeats the type checker in this scene ("failed to produce diagnostic"),
/// and a delegate is the long-standing way to do this anyway.
///
/// Every task handed to us **must** be completed, or watchOS stops granting
/// them — hence the else branch.
final class WatchAppDelegate: NSObject, WKApplicationDelegate {
    var onBackgroundRefresh: (() -> Void)?

    func handle(_ backgroundTasks: Set<WKRefreshBackgroundTask>) {
        for task in backgroundTasks {
            switch task {
            case let refreshTask as WKApplicationRefreshBackgroundTask:
                onBackgroundRefresh?()
                Task { @MainActor in
                    BackgroundRefreshScheduler.scheduleNext()
                }
                refreshTask.setTaskCompletedWithSnapshot(true)

            default:
                task.setTaskCompletedWithSnapshot(false)
            }
        }
    }
}
