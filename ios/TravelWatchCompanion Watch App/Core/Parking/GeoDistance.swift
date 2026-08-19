import Foundation

enum GeoDistance {
    static func meters(
        fromLatitude: Double,
        fromLongitude: Double,
        toLatitude: Double,
        toLongitude: Double
    ) -> Double {
        let earthRadiusMeters = 6_371_000.0
        let startLatitude = degreesToRadians(fromLatitude)
        let endLatitude = degreesToRadians(toLatitude)
        let latitudeDelta = degreesToRadians(toLatitude - fromLatitude)
        let longitudeDelta = degreesToRadians(toLongitude - fromLongitude)

        let haversine = sin(latitudeDelta / 2) * sin(latitudeDelta / 2)
            + cos(startLatitude) * cos(endLatitude)
            * sin(longitudeDelta / 2) * sin(longitudeDelta / 2)
        let centralAngle = 2 * atan2(
            sqrt(haversine),
            sqrt(1 - haversine)
        )

        return earthRadiusMeters * centralAngle
    }

    private static func degreesToRadians(
        _ value: Double
    ) -> Double {
        value * .pi / 180
    }
}
