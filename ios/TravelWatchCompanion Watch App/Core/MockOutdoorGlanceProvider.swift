import Foundation

enum MockOutdoorGlanceProvider {
    static func current() -> OutdoorGlanceData {
        OutdoorGlanceData(
            locationName: WatchStrings.text("mock.location"),
            altitudeMeters: 32,
            sunsetTime: "20:31",
            stepCount: 13482,
            carDistanceText: WatchStrings.text("mock.carDistance"),
            carDirectionSymbol: "↖︎"
        )
    }
}
