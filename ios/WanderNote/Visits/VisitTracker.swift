import CoreLocation
import Foundation

/// Records where the user stopped, using Core Location's visit monitoring.
///
/// This is deliberately *not* continuous GPS. `startMonitoringVisits` reports
/// only arrivals and departures at places the user actually lingered, costs
/// almost no battery, and needs no background mode — the system relaunches the
/// app to deliver each visit. Competitors that draw a metre-by-metre line pay
/// for it in battery, and a travel journal wants "two hours at Kiyomizu-dera"
/// rather than the path between.
///
/// Nothing here leaves the device. Visits are held in local user defaults and
/// read by the app when it next opens.
@objc(VisitTracker)
final class VisitTracker: NSObject {
    @objc static let shared = VisitTracker()

    /// Deliberately bounded. A visit is roughly a few hundred bytes and the app
    /// folds them into trips whenever it opens, so a cap that survives a long
    /// trip offline is enough — and it means nothing here can grow without end.
    private static let maxStoredVisits = 400

    private static let visitsKey = "wandernote.visits.v1"
    private static let enabledKey = "wandernote.visits.enabled"

    private let manager = CLLocationManager()
    private let defaults: UserDefaults
    private var authorizationContinuation: ((String) -> Void)?

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
        super.init()
        manager.delegate = self
    }

    // MARK: - State

    /// Whether the user has switched this on. Off unless they say otherwise:
    /// continuous background location is not something to opt anyone into.
    @objc var isEnabled: Bool {
        defaults.bool(forKey: Self.enabledKey)
    }

    @objc func authorizationName() -> String {
        switch manager.authorizationStatus {
        case .notDetermined: return "notDetermined"
        case .restricted: return "restricted"
        case .denied: return "denied"
        case .authorizedWhenInUse: return "whenInUse"
        case .authorizedAlways: return "always"
        @unknown default: return "unknown"
        }
    }

    // MARK: - Control

    /// Begin monitoring, if the user has granted Always.
    ///
    /// Returns the reason it could not start, or nil when it did.
    @discardableResult
    @objc func start() -> String? {
        guard CLLocationManager.significantLocationChangeMonitoringAvailable() else {
            return "unavailable"
        }

        guard manager.authorizationStatus == .authorizedAlways else {
            return "needs-always-authorization"
        }

        defaults.set(true, forKey: Self.enabledKey)
        manager.startMonitoringVisits()
        return nil
    }

    @objc func stop() {
        defaults.set(false, forKey: Self.enabledKey)
        manager.stopMonitoringVisits()
    }

    /// Resume after a launch or relaunch, but only if it was already on.
    @objc func resumeIfEnabled() {
        guard isEnabled else { return }
        _ = start()
    }

    func requestAlwaysAuthorization(_ completion: @escaping (String) -> Void) {
        let status = manager.authorizationStatus

        // Asking again once the user has answered shows no prompt and calls
        // nothing back, so answer from what we already know instead of leaving
        // the caller waiting on a callback that will never arrive.
        guard status == .notDetermined || status == .authorizedWhenInUse else {
            completion(authorizationName())
            return
        }

        authorizationContinuation = completion
        manager.requestAlwaysAuthorization()
    }

    // MARK: - Storage

    @objc func storedVisits() -> [[String: Any]] {
        defaults.array(forKey: Self.visitsKey) as? [[String: Any]] ?? []
    }

    @objc func clearVisits() {
        defaults.removeObject(forKey: Self.visitsKey)
    }

    private func record(_ visit: CLVisit) {
        // An ongoing visit has no departure yet, and one that began before
        // monitoring started has no arrival. Core Location signals both with
        // sentinel dates rather than nil, and storing those verbatim would put
        // the year 4001 in the user's timeline.
        let arrival = visit.arrivalDate == .distantPast ? nil : visit.arrivalDate
        let departure = visit.departureDate == .distantFuture ? nil : visit.departureDate

        var entry: [String: Any] = [
            "latitude": visit.coordinate.latitude,
            "longitude": visit.coordinate.longitude,
            "accuracy": visit.horizontalAccuracy,
            "recordedAt": Date().timeIntervalSince1970,
        ]

        if let arrival {
            entry["arrivalAt"] = arrival.timeIntervalSince1970
        }
        if let departure {
            entry["departureAt"] = departure.timeIntervalSince1970
        }

        var visits = storedVisits()

        // The same place is reported twice: once on arrival, once on departure.
        // Replace the open record rather than filing the stay twice.
        if let last = visits.last,
           let lastArrival = last["arrivalAt"] as? TimeInterval,
           let arrival,
           abs(lastArrival - arrival.timeIntervalSince1970) < 1 {
            visits[visits.count - 1] = entry
        } else {
            visits.append(entry)
        }

        if visits.count > Self.maxStoredVisits {
            visits.removeFirst(visits.count - Self.maxStoredVisits)
        }

        defaults.set(visits, forKey: Self.visitsKey)
    }
}

extension VisitTracker: CLLocationManagerDelegate {
    func locationManager(_ manager: CLLocationManager, didVisit visit: CLVisit) {
        record(visit)
    }

    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        if let continuation = authorizationContinuation {
            authorizationContinuation = nil
            continuation(authorizationName())
        }

        // Losing Always means monitoring has stopped whether we like it or not.
        if isEnabled, manager.authorizationStatus == .authorizedAlways {
            manager.startMonitoringVisits()
        }
    }
}
