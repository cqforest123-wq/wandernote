import Foundation
import WatchConnectivity

final class WatchConnectivitySnapshotReceiver: NSObject, WCSessionDelegate {
    private let store: OutdoorGlanceSnapshotStore
    private let session: WCSession

    @MainActor
    init(
        store: OutdoorGlanceSnapshotStore,
        session: WCSession = .default
    ) {
        self.store = store
        self.session = session
        super.init()
    }

    func start() {
        guard WCSession.isSupported() else {
            return
        }

        session.delegate = self
        session.activate()

        process(
            applicationContext: session.receivedApplicationContext
        )
    }

    func session(
        _ session: WCSession,
        activationDidCompleteWith activationState: WCSessionActivationState,
        error: Error?
    ) {
        guard error == nil else {
            return
        }

        process(
            applicationContext: session.receivedApplicationContext
        )
    }

    func session(
        _ session: WCSession,
        didReceiveApplicationContext applicationContext: [String: Any]
    ) {
        process(applicationContext: applicationContext)
    }

    private func process(
        applicationContext: [String: Any]
    ) {
        guard let data = applicationContext[
            OutdoorGlanceTransport.snapshotDataKey
        ] as? Data else {
            return
        }

        Task { @MainActor [weak self] in
            guard let self else {
                return
            }

            do {
                try self.store.save(encodedData: data)
            } catch {
                // Preserve the last valid cached snapshot.
            }
        }
    }
}
