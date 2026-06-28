import Combine
import Foundation

@MainActor
final class DailyGlanceStore: ObservableObject {
    @Published private(set) var data: DailyGlanceData

    private let locationAltitudeProvider: LocationAltitudeProvider?
    private let parkingStore: ParkingStore

    init(
        data: DailyGlanceData = .empty(),
        locationAltitudeProvider: LocationAltitudeProvider? = nil,
        parkingStore: ParkingStore? = nil
    ) {
        self.data = data
        self.locationAltitudeProvider =
            locationAltitudeProvider ?? LocationAltitudeProvider()
        self.parkingStore = parkingStore ?? ParkingStore()
        self.locationAltitudeProvider?.onUpdate = { [weak self] update in
            self?.apply(locationUpdate: update)
        }
    }

    func start() {
        refreshClock()
        refreshParking()
        locationAltitudeProvider?.start()
    }

    func refreshClock(
        at date: Date = Date()
    ) {
        data = data.updatingClock(at: date)
    }

    func refreshLocation() {
        locationAltitudeProvider?.refresh()
    }

    @discardableResult
    func recordParkingAtCurrentLocation(
        at date: Date = Date()
    ) -> Bool {
        guard data.locationAuthorization == .authorized,
              let latitude = data.latitude,
              let longitude = data.longitude else {
            return false
        }

        parkingStore.save(
            latitude: latitude,
            longitude: longitude,
            at: date
        )
        data = data.updatingParking(
            latitude: latitude,
            longitude: longitude,
            distanceMeters: 0,
            savedAt: date
        )

        return true
    }

    func refreshParking() {
        data = applyingParkingSnapshot(to: data)
    }

    private func apply(
        locationUpdate update: LocationAltitudeUpdate
    ) {
        let nextData = data.updatingLocation(
            authorization: update.authorization,
            latitude: update.latitude,
            longitude: update.longitude,
            altitudeMeters: update.altitudeMeters
        )

        data = applyingParkingSnapshot(to: nextData)
    }

    private func applyingParkingSnapshot(
        to data: DailyGlanceData
    ) -> DailyGlanceData {
        guard let parking = parkingStore.load() else {
            return data.updatingParking(
                latitude: nil,
                longitude: nil,
                distanceMeters: nil,
                savedAt: nil
            )
        }

        let distance: Double?

        if let latitude = data.latitude,
           let longitude = data.longitude {
            distance = GeoDistance.meters(
                fromLatitude: latitude,
                fromLongitude: longitude,
                toLatitude: parking.latitude,
                toLongitude: parking.longitude
            )
        } else {
            distance = nil
        }

        return data.updatingParking(
            latitude: parking.latitude,
            longitude: parking.longitude,
            distanceMeters: distance,
            savedAt: parking.savedAt
        )
    }
}
