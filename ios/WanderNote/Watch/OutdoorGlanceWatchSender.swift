import Foundation
import WatchConnectivity

enum OutdoorGlanceWatchSenderError: Error, Equatable {
    case watchConnectivityUnsupported
    case encodingFailed(String)
    case invalidEncodedSnapshot(String)
    case applicationContextUpdateFailed(String)
}

final class OutdoorGlanceWatchSender: NSObject {
    private enum SessionState {
        case notStarted
        case activating
        case active
    }

    private let session: WCSession
    private let stateQueue = DispatchQueue(
        label: "com.wandernote.outdoor-glance-watch-sender"
    )

    private var state: SessionState = .notStarted
    private var pendingSnapshotData: Data?

    init(session: WCSession = .default) {
        self.session = session
        super.init()
    }

    func start() {
        stateQueue.async { [weak self] in
            guard let self else {
                return
            }

            guard WCSession.isSupported() else {
                return
            }

            guard self.state == .notStarted else {
                return
            }

            self.state = .activating

            DispatchQueue.main.async { [weak self] in
                guard let self else {
                    return
                }

                self.session.delegate = self
                self.session.activate()
            }
        }
    }

    func publish(_ snapshot: OutdoorGlanceSnapshot) throws {
        let encodedData: Data

        do {
            encodedData = try OutdoorGlanceCodec.encode(snapshot)
        } catch {
            throw OutdoorGlanceWatchSenderError.encodingFailed(
                String(describing: error)
            )
        }

        try publishValidated(encodedData: encodedData)
    }

    func publish(encodedData data: Data) throws {
        let snapshot: OutdoorGlanceSnapshot

        do {
            snapshot = try OutdoorGlanceCodec.decode(data)
        } catch {
            throw OutdoorGlanceWatchSenderError.invalidEncodedSnapshot(
                String(describing: error)
            )
        }

        try publish(snapshot)
    }

    private func publishValidated(encodedData data: Data) throws {
        try stateQueue.sync {
            guard WCSession.isSupported() else {
                throw OutdoorGlanceWatchSenderError.watchConnectivityUnsupported
            }

            pendingSnapshotData = data
            try sendPendingIfPossible()
        }
    }

    private func sendPendingIfPossible() throws {
        guard state == .active,
              session.activationState == .activated,
              session.isPaired,
              session.isWatchAppInstalled,
              let data = pendingSnapshotData else {
            return
        }

        do {
            try session.updateApplicationContext([
                OutdoorGlanceTransport.snapshotDataKey: data
            ])

            pendingSnapshotData = nil
        } catch {
            throw OutdoorGlanceWatchSenderError.applicationContextUpdateFailed(
                String(describing: error)
            )
        }
    }

    private func markActivatedAndFlush() {
        stateQueue.async { [weak self] in
            guard let self else {
                return
            }

            self.state = .active

            do {
                try self.sendPendingIfPossible()
            } catch {
                // Keep the latest pending snapshot for the next state change.
            }
        }
    }

    private func markInactive() {
        stateQueue.async { [weak self] in
            self?.state = .activating
        }
    }
}

extension OutdoorGlanceWatchSender: WCSessionDelegate {
    func session(
        _ session: WCSession,
        activationDidCompleteWith activationState: WCSessionActivationState,
        error: Error?
    ) {
        guard error == nil, activationState == .activated else {
            return
        }

        markActivatedAndFlush()
    }

    func sessionDidBecomeInactive(_ session: WCSession) {
        markInactive()
    }

    func sessionDidDeactivate(_ session: WCSession) {
        markInactive()
        session.activate()
    }

    func sessionWatchStateDidChange(_ session: WCSession) {
        markActivatedAndFlush()
    }
}
