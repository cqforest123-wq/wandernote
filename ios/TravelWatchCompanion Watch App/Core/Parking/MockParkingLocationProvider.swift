import Foundation

enum MockParkingLocationProvider {
    static func current() -> ParkingLocationData {
        ParkingLocationData(
            savedAtText: "14:20",
            distanceText: WatchStrings.text("mock.carDistance"),
            directionSymbol: "↖︎"
        )
    }
}
