import Foundation

enum MockDailyActivityProvider {
    static func current() -> DailyActivityData {
        DailyActivityData(
            stepCount: 13482,
            distanceText: "9.6 km"
        )
    }
}
