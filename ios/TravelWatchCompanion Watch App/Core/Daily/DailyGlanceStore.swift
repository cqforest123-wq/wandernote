import Combine
import Foundation

@MainActor
final class DailyGlanceStore: ObservableObject {
    @Published private(set) var data: DailyGlanceData

    private let locationAltitudeProvider: LocationAltitudeProvider?

    init(
        data: DailyGlanceData = .empty(),
        locationAltitudeProvider: LocationAltitudeProvider? = nil
    ) {
        self.data = data
        self.locationAltitudeProvider =
            locationAltitudeProvider ?? LocationAltitudeProvider()
        self.locationAltitudeProvider?.onUpdate = { [weak self] update in
            self?.apply(locationUpdate: update)
        }
    }

    func start() {
        refreshClock()
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

    private func apply(
        locationUpdate update: LocationAltitudeUpdate
    ) {
        data = data.updatingLocation(
            authorization: update.authorization,
            latitude: update.latitude,
            longitude: update.longitude,
            altitudeMeters: update.altitudeMeters
        )
    }
}
