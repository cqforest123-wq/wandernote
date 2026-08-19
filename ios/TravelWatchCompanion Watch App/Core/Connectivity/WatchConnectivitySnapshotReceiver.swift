import Combine
import Foundation
import WatchConnectivity

private enum WatchConnectivityDiagnostics {
    static func log(_ message: @autoclosure () -> String) {
        #if DEBUG
        print("[WatchGlance] \(message())")
        #endif
    }
}

/// What the link is doing, so the watch can say why it has no trip data.
///
/// "Waiting for iPhone" with no further explanation is untraceable from the
/// wrist: the phone reports the payload as sent while the watch shows nothing,
/// and there is nowhere to read a log. These few fields are surfaced in the UI.
@MainActor
final class WatchLinkStatus: ObservableObject {
    @Published var activation: String = "starting"
    @Published var reachable: Bool = false
    @Published var receivedBytes: Int?
    @Published var receivedAt: Date?
    @Published var lastError: String?

    static let shared = WatchLinkStatus()
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
        note(activation: "activating")

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
            note(activation: "activation-failed", error: String(describing: error))
            return
        }

        note(
            activation: activationState == .activated ? "activated" : "state-\(activationState.rawValue)",
            reachable: session.isReachable
        )

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

    private func note(
        activation: String? = nil,
        reachable: Bool? = nil,
        error: String? = nil
    ) {
        Task { @MainActor in
            if let activation {
                WatchLinkStatus.shared.activation = activation
            }
            if let reachable {
                WatchLinkStatus.shared.reachable = reachable
            }
            if let error {
                WatchLinkStatus.shared.lastError = error
            }
        }
    }

    /// Push the newly received snapshot out to the watch face.
    ///
    /// Only ContentView used to write the complication payload, so the face
    /// stayed frozen at whatever was true the last time someone opened the
    /// Watch App — which defeats the entire point of a complication. The
    /// system launches us in the background to deliver an application context,
    /// and that is exactly the moment the face should change.
    ///
    /// Live sensor readings are unavailable to a background launch, so this
    /// uses the cached daily data. Steps and altitude may lag until the app is
    /// next opened; the trip, weather and sun times — the things the face is
    /// actually for — are current.
    @MainActor
    private func refreshComplication() {
        let now = Date()

        GlanceWidgetPayloadWriter.write(
            from: GlanceDataMapper.make(
                snapshot: store.snapshot,
                availability: store.availability(at: now),
                dailyData: DailyGlanceCache.load(),
                at: now
            ),
            language: store.snapshot?.language
        )
    }

    private func process(
        applicationContext: [String: Any]
    ) {
        guard let data = applicationContext[
            OutdoorGlanceTransport.snapshotDataKey
        ] as? Data else {
            WatchConnectivityDiagnostics.log(
                "application context did not contain outdoor glance payload"
            )
            note(
                error: applicationContext.isEmpty
                    ? "empty-context"
                    : "context-keys:\(applicationContext.keys.joined(separator: ","))"
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

            WatchLinkStatus.shared.receivedBytes = data.count
            WatchLinkStatus.shared.receivedAt = Date()

            do {
                try self.store.save(encodedData: data)
                WatchLinkStatus.shared.lastError = nil
                WatchConnectivityDiagnostics.log(
                    "cache updated from received payload"
                )
                self.refreshComplication()
            } catch {
                WatchLinkStatus.shared.lastError =
                    "decode:\(String(describing: error).prefix(40))"
                WatchConnectivityDiagnostics.log(
                    "received payload rejected; preserving cached snapshot"
                )
                // Preserve the last valid cached snapshot.
            }
        }
    }
}
