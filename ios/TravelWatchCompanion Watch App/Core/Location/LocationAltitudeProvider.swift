import CoreLocation
import Foundation

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
        guard CLLocationManager.locationServicesEnabled() else {
            publish(
                authorization: .unavailable
            )
            return
        }

        handleAuthorization(
            manager.authorizationStatus
        )
    }

    func refresh() {
        guard manager.authorizationStatus == .authorizedAlways ||
                manager.authorizationStatus == .authorizedWhenInUse else {
            handleAuthorization(manager.authorizationStatus)
            return
        }

        manager.requestLocation()
    }

    private func handleAuthorization(
        _ status: CLAuthorizationStatus
    ) {
        switch status {
        case .notDetermined:
            publish(authorization: .notDetermined)
            manager.requestWhenInUseAuthorization()

        case .authorizedAlways, .authorizedWhenInUse:
            publish(authorization: .authorized)
            manager.requestLocation()

        case .denied:
            publish(authorization: .denied)

        case .restricted:
            publish(authorization: .restricted)

        @unknown default:
            publish(authorization: .unavailable)
        }
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
            self?.publish(
                authorization: .unavailable
            )
        }
    }
}
