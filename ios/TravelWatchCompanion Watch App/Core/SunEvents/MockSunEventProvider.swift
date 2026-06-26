import Foundation

enum MockSunEventProvider {
    static func current() -> SunEventData {
        SunEventData(
            sunriseTime: "05:48",
            sunsetTime: "20:31",
            daylightRemainingText: "3h 12m"
        )
    }
}
