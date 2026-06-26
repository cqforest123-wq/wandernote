import Combine
import Foundation

@MainActor
final class WatchCompanionRuntime: ObservableObject {
    let store: OutdoorGlanceSnapshotStore

    private let receiver: WatchConnectivitySnapshotReceiver
    private var hasStarted = false

    init(store: OutdoorGlanceSnapshotStore? = nil) {
        let resolvedStore = store ?? OutdoorGlanceSnapshotStore()

        self.store = resolvedStore
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
    }
}
