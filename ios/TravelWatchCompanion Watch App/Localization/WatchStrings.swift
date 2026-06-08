import Foundation

enum WatchStrings {
    static var languageCode: String {
        Locale.current.language.languageCode?.identifier ?? "en"
    }

    static func text(_ key: String) -> String {
        let isChinese = languageCode.hasPrefix("zh")

        let en: [String: String] = [
            "app.title": "Travel Glance",
            "location": "Location",
            "altitude": "Altitude",
            "sunset": "Sunset",
            "steps": "Steps",
            "car": "Car",
            "mock.location": "San Francisco",
            "mock.carDistance": "0.8 km"
        ]

        let zhHans: [String: String] = [
            "app.title": "旅行速览",
            "location": "位置",
            "altitude": "海拔",
            "sunset": "日落",
            "steps": "步数",
            "car": "停车点",
            "mock.location": "旧金山",
            "mock.carDistance": "0.8 公里"
        ]

        return (isChinese ? zhHans[key] : en[key]) ?? en[key] ?? key
    }
}
