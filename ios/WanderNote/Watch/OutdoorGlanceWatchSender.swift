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

    @discardableResult
    func publish(_ snapshot: OutdoorGlanceSnapshot) throws -> String {
        let encodedData: Data

        do {
            encodedData = try OutdoorGlanceCodec.encode(snapshot)
        } catch {
            throw OutdoorGlanceWatchSenderError.encodingFailed(
                String(describing: error)
            )
        }

        return try publishValidated(encodedData: encodedData)
    }

    @discardableResult
    func publish(encodedData data: Data) throws -> String {
        let snapshot: OutdoorGlanceSnapshot

        do {
            snapshot = try OutdoorGlanceCodec.decode(data)
        } catch {
            throw OutdoorGlanceWatchSenderError.invalidEncodedSnapshot(
                String(describing: error)
            )
        }

        return try publish(snapshot)
    }

    private func publishValidated(encodedData data: Data) throws -> String {
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
            return try sendPendingIfPossible()
        }
    }

    /// Why a payload could not go out right now, or nil if it did.
    ///
    /// This used to return silently, so the JavaScript promise resolved
    /// whether the snapshot reached the watch or merely sat in a queue — and a
    /// watch stuck in Daily mode looked like a watch-side bug for hours.
    @discardableResult
    private func sendPendingIfPossible() throws -> String {
        guard state == .active,
              session.activationState == .activated,
              session.isPaired,
              session.isWatchAppInstalled,
              let data = pendingSnapshotData else {
            let reason: String

            if state != .active {
                reason = "runtime-inactive"
            } else if session.activationState != .activated {
                reason = "session-not-activated"
            } else if !session.isPaired {
                reason = "watch-not-paired"
            } else if !session.isWatchAppInstalled {
                reason = "watch-app-not-installed"
            } else {
                reason = "nothing-pending"
            }

            OutdoorGlanceWatchDiagnostics.log(
                "payload pending; reason=\(reason)"
            )
            return reason
        }

        do {
            try session.updateApplicationContext([
                OutdoorGlanceTransport.snapshotDataKey: data
            ])

            pendingSnapshotData = nil
            OutdoorGlanceWatchDiagnostics.log(
                "payload sent with updateApplicationContext"
            )

            return "sent"
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
