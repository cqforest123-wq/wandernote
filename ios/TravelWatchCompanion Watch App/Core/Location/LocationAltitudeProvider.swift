import CoreLocation
import Foundation

private enum LocationAltitudeDiagnostics {
    static func log(_ message: @autoclosure () -> String) {
        #if DEBUG
        print("[WatchGlance] \(message())")
        #endif
    }
}

struct LocationAltitudeUpdate: Equatable {
    let authorization: GlanceLocationAuthorization
    let latitude: Double?
    let longitude: Double?
    let altitudeMeters: Double?
}

@MainActor
final class LocationAltitudeProvider: NSObject {
    var onUpdate: ((LocationAltitudeUpdate) -> Void)?

    private let manager: CLLocationManager
    private var isUpdatingLocation = false

    init(
        manager: CLLocationManager = CLLocationManager()
    ) {
        self.manager = manager
        super.init()
        self.manager.delegate = self
        self.manager.desiredAccuracy = kCLLocationAccuracyBest
        self.manager.distanceFilter = 25
    }

    func start() {
        LocationAltitudeDiagnostics.log(
            "location provider starting"
        )
        refresh()
    }

    func refresh() {
        guard CLLocationManager.locationServicesEnabled() else {
            LocationAltitudeDiagnostics.log(
                "altitude unavailable because location services are disabled"
            )
            publish(
                authorization: .unavailable
            )
            return
        }

        handleAuthorization(
            manager.authorizationStatus
        )
    }

    private func handleAuthorization(
        _ status: CLAuthorizationStatus
    ) {
        switch status {
        case .notDetermined:
            LocationAltitudeDiagnostics.log(
                "location authorization not determined; requesting permission"
            )
            publish(authorization: .notDetermined)
            manager.requestWhenInUseAuthorization()

        case .authorizedAlways, .authorizedWhenInUse:
            LocationAltitudeDiagnostics.log(
                "location authorization granted; requesting location"
            )
            publish(authorization: .authorized)
            requestCurrentLocation()

        case .denied:
            LocationAltitudeDiagnostics.log(
                "location authorization denied"
            )
            stopUpdatingLocation()
            publish(authorization: .denied)

        case .restricted:
            LocationAltitudeDiagnostics.log(
                "location authorization restricted"
            )
            stopUpdatingLocation()
            publish(authorization: .restricted)

        @unknown default:
            LocationAltitudeDiagnostics.log(
                "location authorization unavailable"
            )
            stopUpdatingLocation()
            publish(authorization: .unavailable)
        }
    }

    private func requestCurrentLocation() {
        startUpdatingLocationIfNeeded()
        manager.requestLocation()
    }

    private func startUpdatingLocationIfNeeded() {
        guard !isUpdatingLocation else {
            return
        }

        isUpdatingLocation = true
        manager.startUpdatingLocation()
        LocationAltitudeDiagnostics.log(
            "continuous location updates started"
        )
    }

    private func stopUpdatingLocation() {
        guard isUpdatingLocation else {
            return
        }

        isUpdatingLocation = false
        manager.stopUpdatingLocation()
        LocationAltitudeDiagnostics.log(
            "continuous location updates stopped"
        )
    }

    private func publish(
        authorization: GlanceLocationAuthorization,
        location: CLLocation? = nil
    ) {
        let altitudeMeters: Double?

        if let location, location.verticalAccuracy >= 0 {
            altitudeMeters = location.altitude
        } else {
            altitudeMeters = nil
        }

        onUpdate?(
            LocationAltitudeUpdate(
                authorization: authorization,
                latitude: location?.coordinate.latitude,
                longitude: location?.coordinate.longitude,
                altitudeMeters: altitudeMeters
            )
        )
        LocationAltitudeDiagnostics.log(
            altitudeMeters == nil
                ? "altitude unavailable for latest location update"
                : "altitude updated from latest location"
        )
    }
}

extension LocationAltitudeProvider: CLLocationManagerDelegate {
    nonisolated func locationManagerDidChangeAuthorization(
        _ manager: CLLocationManager
    ) {
        Task { @MainActor [weak self] in
            self?.handleAuthorization(manager.authorizationStatus)
        }
    }

    nonisolated func locationManager(
        _ manager: CLLocationManager,
        didUpdateLocations locations: [CLLocation]
    ) {
        guard let location = locations.last else {
            return
        }

        Task { @MainActor [weak self] in
            self?.publish(
                authorization: .authorized,
                location: location
            )
        }
    }

    nonisolated func locationManager(
        _ manager: CLLocationManager,
        didFailWithError error: Error
    ) {
        Task { @MainActor [weak self] in
            LocationAltitudeDiagnostics.log(
                "location request failed: \(String(describing: error))"
            )

            let status = manager.authorizationStatus

            if status == .authorizedAlways || status == .authorizedWhenInUse {
                self?.publish(
                    authorization: .authorized
                )
                return
            }

            self?.publish(
                authorization: .unavailable
            )
        }
    }
}
