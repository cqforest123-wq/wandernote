import Combine
import Foundation
import WatchKit

@MainActor
final class WatchCompanionRuntime: ObservableObject {
    let store: OutdoorGlanceSnapshotStore
    let dailyStore: DailyGlanceStore

    private let receiver: WatchConnectivitySnapshotReceiver
    private var hasStarted = false

    init(
        store: OutdoorGlanceSnapshotStore? = nil,
        dailyStore: DailyGlanceStore? = nil
    ) {
        let resolvedStore = store ?? OutdoorGlanceSnapshotStore()
        let resolvedDailyStore = dailyStore ?? DailyGlanceStore()

        self.store = resolvedStore
        self.dailyStore = resolvedDailyStore
        self.receiver = WatchConnectivitySnapshotReceiver(
            store: resolvedStore
        )
    }

    func start() {
        guard !hasStarted else {
            return
        }

        hasStarted = true
        receiver.start()
        dailyStore.start()
        BackgroundRefreshScheduler.scheduleNext()
    }

    /// Queue the next background window. SwiftUI's `.backgroundTask(.appRefresh)`
    /// completes the task for us, so all that is left is asking for another.
    func scheduleNextBackgroundRefresh() {
        BackgroundRefreshScheduler.scheduleNext()
    }

    func refreshActiveData() {
        dailyStore.refresh()
    }
}
