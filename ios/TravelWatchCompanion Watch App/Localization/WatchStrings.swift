import Foundation

enum WatchStrings {
    private enum Language {
        case english
        case simplifiedChinese
        case traditionalChinese
    }

    private static var language: Language {
        let locale = Locale.current
        let languageCode = locale.languageCode ?? "en"
        let scriptCode = locale.scriptCode
        let regionCode = locale.regionCode

        guard languageCode == "zh" else {
            return .english
        }

        if scriptCode == "Hant" ||
            ["TW", "HK", "MO"].contains(regionCode ?? "") {
            return .traditionalChinese
        }

        return .simplifiedChinese
    }

    static func text(_ key: String) -> String {
        switch language {
        case .english:
            return english[key] ?? key
        case .simplifiedChinese:
            return simplifiedChinese[key] ?? english[key] ?? key
        case .traditionalChinese:
            return traditionalChinese[key] ?? english[key] ?? key
        }
    }

    static func format(
        _ key: String,
        _ arguments: CVarArg...
    ) -> String {
        String(
            format: text(key),
            locale: Locale.current,
            arguments: arguments
        )
    }

    private static let english: [String: String] = [
        "app.title": "Travel Glance",
        "trip": "Trip",
        "trip.dayFormat": "%@ · Day %d",
        "location": "Location",
        "altitude": "Altitude",
        "weather": "Weather",
        "sunset": "Sunset",
        "daylight": "Daylight left",
        "steps": "Steps",
        "car": "Car",
        "updated": "Updated",
        "status.stale": "Data may be outdated",
        "status.waiting": "Waiting for iPhone",
        "status.waitingDetail": "Open WanderNote on your iPhone to sync travel data.",
        "value.unavailable": "Unavailable",
        "duration.hoursMinutes": "%dh %dm",
        "mock.location": "San Francisco",
        "mock.carDistance": "0.8 km"
    ]

    private static let simplifiedChinese: [String: String] = [
        "app.title": "旅行速览",
        "trip": "旅程",
        "trip.dayFormat": "%@ · 第%d天",
        "location": "位置",
        "altitude": "海拔",
        "weather": "天气",
        "sunset": "日落",
        "daylight": "剩余日照",
        "steps": "步数",
        "car": "停车点",
        "updated": "更新时间",
        "status.stale": "数据可能已过期",
        "status.waiting": "等待 iPhone 同步",
        "status.waitingDetail": "请在 iPhone 上打开 WanderNote 同步旅行数据。",
        "value.unavailable": "暂无数据",
        "duration.hoursMinutes": "%d小时%d分",
        "mock.location": "旧金山",
        "mock.carDistance": "0.8 公里"
    ]

    private static let traditionalChinese: [String: String] = [
        "app.title": "旅行速覽",
        "trip": "旅程",
        "trip.dayFormat": "%@ · 第%d天",
        "location": "位置",
        "altitude": "海拔",
        "weather": "天氣",
        "sunset": "日落",
        "daylight": "剩餘日照",
        "steps": "步數",
        "car": "停車點",
        "updated": "更新時間",
        "status.stale": "資料可能已過期",
        "status.waiting": "等待 iPhone 同步",
        "status.waitingDetail": "請在 iPhone 上開啟 WanderNote 同步旅行資料。",
        "value.unavailable": "暫無資料",
        "duration.hoursMinutes": "%d小時%d分",
        "mock.location": "舊金山",
        "mock.carDistance": "0.8 公里"
    ]
}
