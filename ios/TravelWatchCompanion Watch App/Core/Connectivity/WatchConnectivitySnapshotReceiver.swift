import Foundation
import WatchConnectivity

private enum WatchConnectivityDiagnostics {
    static func log(_ message: @autoclosure () -> String) {
        #if DEBUG
        print("[WatchGlance] \(message())")
        #endif
    }
}

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
            WatchConnectivityDiagnostics.log(
                "WatchConnectivity unsupported on receiver"
            )
            return
        }

        session.delegate = self
        session.activate()
        WatchConnectivityDiagnostics.log(
            "WatchConnectivity receiver activating"
        )

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
            WatchConnectivityDiagnostics.log(
                "receiver activation failed: \(String(describing: error))"
            )
            return
        }

        WatchConnectivityDiagnostics.log(
            "receiver activation completed with state=\(activationState.rawValue)"
        )
        process(
            applicationContext: session.receivedApplicationContext
        )
    }

    func session(
        _ session: WCSession,
        didReceiveApplicationContext applicationContext: [String: Any]
    ) {
        WatchConnectivityDiagnostics.log(
            "payload received on Watch"
        )
        process(applicationContext: applicationContext)
    }

    #if os(iOS)
    func sessionDidBecomeInactive(_ session: WCSession) {}

    func sessionDidDeactivate(_ session: WCSession) {
        session.activate()
    }
    #endif

    private func process(
        applicationContext: [String: Any]
    ) {
        guard let data = applicationContext[
            OutdoorGlanceTransport.snapshotDataKey
        ] as? Data else {
            WatchConnectivityDiagnostics.log(
                "application context did not contain outdoor glance payload"
            )
            return
        }

        WatchConnectivityDiagnostics.log(
            "processing payload bytes=\(data.count)"
        )
        Task { @MainActor [weak self] in
            guard let self else {
                return
            }

            do {
                try self.store.save(encodedData: data)
                WatchConnectivityDiagnostics.log(
                    "cache updated from received payload"
                )
            } catch {
                WatchConnectivityDiagnostics.log(
                    "received payload rejected; preserving cached snapshot"
                )
                // Preserve the last valid cached snapshot.
            }
        }
    }
}
