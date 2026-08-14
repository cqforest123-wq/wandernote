import CoreLocation
import Foundation

/// Turns the watch's raw coordinates into a place name.
///
/// Without this the Location row can only render decimal degrees, which is not
/// something anyone can read off a wrist. `CLGeocoder` needs the network and is
/// rate-limited by the system, so lookups are throttled hard and every failure
/// is silent — the caller keeps showing coordinates.
@MainActor
final class PlaceNameResolver {
    /// Don't re-resolve until the wearer has actually moved somewhere else.
    private static let minimumMovementMeters: Double = 500
    /// Floor between requests, so a jittery GPS fix cannot spam the geocoder.
    private static let minimumInterval: TimeInterval = 60

    private let geocoder = CLGeocoder()
    private var lastResolvedLatitude: Double?
    private var lastResolvedLongitude: Double?
    private var lastAttemptAt: Date?
    private var isResolving = false

    var onResolve: ((String?) -> Void)?

    func resolveIfNeeded(
        latitude: Double?,
        longitude: Double?,
        hasName: Bool,
        now: Date = Date()
    ) {
        guard let latitude, let longitude, !isResolving else {
            return
        }

        if let lastAttemptAt,
           now.timeIntervalSince(lastAttemptAt) < Self.minimumInterval {
            return
        }

        if hasName,
           let lastResolvedLatitude,
           let lastResolvedLongitude {
            let moved = GeoDistance.meters(
                fromLatitude: latitude,
                fromLongitude: longitude,
                toLatitude: lastResolvedLatitude,
                toLongitude: lastResolvedLongitude
            )

            if moved < Self.minimumMovementMeters {
                return
            }
        }

        isResolving = true
        lastAttemptAt = now

        let location = CLLocation(
            latitude: latitude,
            longitude: longitude
        )

        geocoder.reverseGeocodeLocation(location) { [weak self] placemarks, _ in
            Task { @MainActor in
                guard let self else {
                    return
                }

                self.isResolving = false

                guard let name = Self.name(from: placemarks?.first) else {
                    return
                }

                self.lastResolvedLatitude = latitude
                self.lastResolvedLongitude = longitude
                self.onResolve?(name)
            }
        }
    }

    private static func name(
        from placemark: CLPlacemark?
    ) -> String? {
        guard let placemark else {
            return nil
        }

        return placemark.locality
            ?? placemark.subAdministrativeArea
            ?? placemark.administrativeArea
            ?? placemark.country
    }
}
