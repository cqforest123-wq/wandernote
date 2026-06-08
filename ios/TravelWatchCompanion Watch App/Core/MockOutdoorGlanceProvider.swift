import Foundation

enum MockOutdoorGlanceProvider {
    static func current() -> OutdoorGlanceData {
        OutdoorGlanceData(
            locationName: WatchStrings.text("mock.location"),
            altitudeMeters: 32,
            sun: MockSunEventProvider.current(),
            stepCount: 13482,
            carDistanceText: WatchStrings.text("mock.carDistance"),
            carDirectionSymbol: "↖︎"
        )
    }
}
