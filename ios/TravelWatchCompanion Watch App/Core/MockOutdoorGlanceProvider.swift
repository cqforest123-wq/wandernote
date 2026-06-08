import Foundation

enum MockOutdoorGlanceProvider {
    static func current() -> OutdoorGlanceData {
        OutdoorGlanceData(
            locationName: WatchStrings.text("mock.location"),
            altitudeMeters: 32,
            sun: MockSunEventProvider.current(),
            activity: MockDailyActivityProvider.current(),
            parking: MockParkingLocationProvider.current()
        )
    }
}
