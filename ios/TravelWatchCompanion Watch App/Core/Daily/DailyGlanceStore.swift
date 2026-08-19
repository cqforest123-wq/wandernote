import Combine
import Foundation

private enum DailyGlanceDiagnostics {
    static func log(_ message: @autoclosure () -> String) {
        #if DEBUG
        print("[WatchGlance] \(message())")
        #endif
    }
}

@MainActor
final class DailyGlanceStore: ObservableObject {
    @Published private(set) var data: DailyGlanceData {
        didSet {
            DailyGlanceCache.save(data)
        }
    }

    private let locationAltitudeProvider: LocationAltitudeProvider?
    private let parkingStore: ParkingStore
    private let activityStepProvider: ActivityStepProvider?
    private let placeNameResolver: PlaceNameResolver?
    private let pressureProvider: PressureTrendProvider?
    private var refreshCancellable: AnyCancellable?
    private var hasStarted = false

    /// `nil` hydrates from the last cached reading so a relaunch shows numbers
    /// immediately instead of a screenful of "unavailable" while the sensors
    /// spin up. Tests pass an explicit value.
    init(
        data: DailyGlanceData? = nil,
        locationAltitudeProvider: LocationAltitudeProvider? = nil,
        parkingStore: ParkingStore? = nil,
        activityStepProvider: ActivityStepProvider? = nil,
        placeNameResolver: PlaceNameResolver? = nil,
        pressureProvider: PressureTrendProvider? = nil
    ) {
        self.data = data ?? DailyGlanceCache.load() ?? .empty()
        self.locationAltitudeProvider =
            locationAltitudeProvider ?? LocationAltitudeProvider()
        self.parkingStore = parkingStore ?? ParkingStore()
        self.activityStepProvider =
            activityStepProvider ?? ActivityStepProvider()
        self.placeNameResolver = placeNameResolver ?? PlaceNameResolver()
        self.pressureProvider = pressureProvider ?? PressureTrendProvider()
        self.pressureProvider?.onUpdate = { [weak self] kPa, falling in
            self?.data = self?.data.updatingPressure(
                kilopascals: kPa,
                falling: falling
            ) ?? .empty()
        }
        self.locationAltitudeProvider?.onUpdate = { [weak self] update in
            self?.apply(locationUpdate: update)
        }
        self.activityStepProvider?.onUpdate = { [weak self] update in
            self?.apply(activityUpdate: update)
        }
        self.placeNameResolver?.onResolve = { [weak self] name in
            guard let self, let name else {
                return
            }

            self.data = self.data.updatingLocationName(name)
            DailyGlanceDiagnostics.log(
                "resolved place name for current watch location"
            )
        }
    }

    func start() {
        guard !hasStarted else {
            refresh()
            return
        }

        hasStarted = true
        DailyGlanceDiagnostics.log(
            "Daily fallback store starting"
        )
        locationAltitudeProvider?.start()
        activityStepProvider?.start()
        pressureProvider?.start()
        refreshClock()
        refreshParking()
        startRefreshTimer()
    }

    func refresh(
        at date: Date = Date()
    ) {
        refreshClock(at: date)
        refreshParking()
        refreshLocation()
        refreshActivity()
    }

    func refreshClock(
        at date: Date = Date()
    ) {
        data = applyingSunEvents(
            to: data.updatingClock(at: date),
            at: date
        )
    }

    func refreshLocation() {
        locationAltitudeProvider?.refresh()
    }

    func refreshActivity() {
        activityStepProvider?.refresh()
    }

    private func startRefreshTimer() {
        refreshCancellable = Timer
            .publish(every: 60, on: .main, in: .common)
            .autoconnect()
            .sink { [weak self] date in
                Task { @MainActor in
                    self?.refresh(at: date)
                }
            }
    }

    @discardableResult
    func recordParkingAtCurrentLocation(
        at date: Date = Date()
    ) -> Bool {
        guard data.locationAuthorization == .authorized,
              let latitude = data.latitude,
              let longitude = data.longitude else {
            DailyGlanceDiagnostics.log(
                "parking save skipped because current watch location is unavailable"
            )
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
        DailyGlanceDiagnostics.log(
            "parking saved from current watch location"
        )

        return true
    }

    func refreshParking() {
        DailyGlanceDiagnostics.log(
            "parking refresh requested"
        )
        data = applyingParkingSnapshot(to: data)
    }

    private func apply(
        locationUpdate update: LocationAltitudeUpdate
    ) {
        // An authorization-change notification arrives with no location
        // attached. Writing its nil coordinates over the last known fix wiped
        // altitude, sunset and daylight while the place name — a separate
        // field — stayed on screen, which is exactly how the watch ended up
        // showing "成都市" beside three empty rows.
        let nextData = data.updatingLocation(
            authorization: update.authorization,
            latitude: update.latitude ?? data.latitude,
            longitude: update.longitude ?? data.longitude,
            altitudeMeters: update.altitudeMeters ?? data.altitudeMeters
        )

        DailyGlanceDiagnostics.log(
            "location update applied with authorization=\(update.authorization)"
        )
        data = applyingParkingSnapshot(
            to: applyingSunEvents(to: nextData)
        )

        placeNameResolver?.resolveIfNeeded(
            latitude: data.latitude,
            longitude: data.longitude,
            hasName: data.currentLocationName != nil
        )
    }

    private func apply(
        activityUpdate update: ActivityStepUpdate
    ) {
        data = data.updatingSteps(update.stepsToday)
        DailyGlanceDiagnostics.log(
            update.stepsToday == nil
                ? "HealthKit steps unavailable"
                : "HealthKit steps updated"
        )
    }

    private func applyingParkingSnapshot(
        to data: DailyGlanceData
    ) -> DailyGlanceData {
        guard let parking = parkingStore.load() else {
            DailyGlanceDiagnostics.log(
                "parking unavailable because no local parking point is saved"
            )
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
            DailyGlanceDiagnostics.log(
                "parking distance unavailable because current location is missing"
            )
        }

        return data.updatingParking(
            latitude: parking.latitude,
            longitude: parking.longitude,
            distanceMeters: distance,
            savedAt: parking.savedAt
        )
    }

    private func applyingSunEvents(
        to data: DailyGlanceData,
        at date: Date = Date()
    ) -> DailyGlanceData {
        // Gate on having coordinates, not on the authorization enum. Sun times
        // are pure arithmetic on a latitude and longitude — if we hold a fix,
        // whether from this session or the last one, they are computable. The
        // old check wiped a perfectly good sunset whenever the enum was not yet
        // .authorized, which includes the moment right after launch: the watch
        // showed a resolved place name beside an empty sunset.
        guard data.latitude != nil, data.longitude != nil else {
            DailyGlanceDiagnostics.log(
                "sun unavailable because no coordinates are known (authorization=\(data.locationAuthorization))"
            )
            return data.updatingSun(
                sunrise: nil,
                sunset: nil,
                daylightRemaining: nil
            )
        }

        let events = SunEventCalculator.events(
            on: date,
            latitude: data.latitude,
            longitude: data.longitude
        )

        if events.sunrise == nil || events.sunset == nil {
            DailyGlanceDiagnostics.log(
                "sun unavailable for latest location"
            )
        } else {
            DailyGlanceDiagnostics.log(
                "sun events updated"
            )
        }

        return data.updatingSun(
            sunrise: events.sunrise,
            sunset: events.sunset,
            daylightRemaining: events.daylightRemaining
        )
    }
}
