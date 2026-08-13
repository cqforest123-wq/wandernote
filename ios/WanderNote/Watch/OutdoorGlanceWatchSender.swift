import Foundation
import WatchConnectivity

enum OutdoorGlanceWatchDiagnostics {
    static func log(_ message: @autoclosure () -> String) {
        #if DEBUG
        print("[OutdoorGlance] \(message())")
        #endif
    }
}

enum OutdoorGlanceWatchSenderError: Error, Equatable {
    case watchConnectivityUnsupported
    case encodingFailed(String)
    case invalidEncodedSnapshot(String)
    case applicationContextUpdateFailed(String)

    var bridgeCode: String {
        switch self {
        case .watchConnectivityUnsupported:
            return "ERR_OUTDOOR_GLANCE_WATCH_CONNECTIVITY_UNSUPPORTED"
        case .encodingFailed:
            return "ERR_OUTDOOR_GLANCE_ENCODING_FAILED"
        case .invalidEncodedSnapshot:
            return "ERR_OUTDOOR_GLANCE_INVALID_SNAPSHOT"
        case .applicationContextUpdateFailed:
            return "ERR_OUTDOOR_GLANCE_CONTEXT_UPDATE_FAILED"
        }
    }
}

extension OutdoorGlanceWatchSenderError: LocalizedError {
    var errorDescription: String? {
        switch self {
        case .watchConnectivityUnsupported:
            return "WatchConnectivity is not supported on this device."
        case let .encodingFailed(message):
            return "Outdoor glance snapshot encoding failed: \(message)"
        case let .invalidEncodedSnapshot(message):
            return "Outdoor glance snapshot validation failed: \(message)"
        case let .applicationContextUpdateFailed(message):
            return "Outdoor glance snapshot context update failed: \(message)"
        }
    }
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
                OutdoorGlanceWatchDiagnostics.log(
                    "WatchConnectivity unsupported on sender device"
                )
                return
            }

            guard self.state == .notStarted else {
                OutdoorGlanceWatchDiagnostics.log(
                    "sender start skipped because runtime already started"
                )
                return
            }

            self.state = .activating
            OutdoorGlanceWatchDiagnostics.log(
                "WatchConnectivity sender activating"
            )

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
                OutdoorGlanceWatchDiagnostics.log(
                    "publish failed because WatchConnectivity is unsupported"
                )
                throw OutdoorGlanceWatchSenderError.watchConnectivityUnsupported
            }

            pendingSnapshotData = data
            OutdoorGlanceWatchDiagnostics.log(
                "payload queued for WatchConnectivity send"
            )
            try sendPendingIfPossible()
        }
    }

    private func sendPendingIfPossible() throws {
        guard state == .active,
              session.activationState == .activated,
              session.isPaired,
              session.isWatchAppInstalled,
              let data = pendingSnapshotData else {
            OutdoorGlanceWatchDiagnostics.log(
                "payload pending; state=\(state), activation=\(session.activationState.rawValue), paired=\(session.isPaired), installed=\(session.isWatchAppInstalled)"
            )
            return
        }

        do {
            try session.updateApplicationContext([
                OutdoorGlanceTransport.snapshotDataKey: data
            ])

            pendingSnapshotData = nil
            OutdoorGlanceWatchDiagnostics.log(
                "payload sent with updateApplicationContext"
            )
        } catch {
            OutdoorGlanceWatchDiagnostics.log(
                "payload send failed: \(String(describing: error))"
            )
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
            OutdoorGlanceWatchDiagnostics.log(
                "WatchConnectivity sender activated"
            )

            do {
                try self.sendPendingIfPossible()
            } catch {
                OutdoorGlanceWatchDiagnostics.log(
                    "pending payload retained after activation flush failure"
                )
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
            OutdoorGlanceWatchDiagnostics.log(
                "sender activation incomplete: state=\(activationState.rawValue), error=\(String(describing: error))"
            )
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
        OutdoorGlanceWatchDiagnostics.log(
            "watch state changed; paired=\(session.isPaired), installed=\(session.isWatchAppInstalled)"
        )
        markActivatedAndFlush()
    }
}
