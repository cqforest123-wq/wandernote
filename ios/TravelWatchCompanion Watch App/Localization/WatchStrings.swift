import Foundation

enum WatchStrings {
    private enum Language {
        case english
        case simplifiedChinese
        case traditionalChinese
    }

    private static var language: Language {
        let locale = Locale.current
        let languageCode = locale.language.languageCode?.identifier ?? "en"
        let scriptCode = locale.language.script?.identifier
        let regionCode = locale.region?.identifier

        guard languageCode == "zh" else {
            return .english
        }

        if scriptCode == "Hant" {
            return .traditionalChinese
        }

        if ["TW", "HK", "MO"].contains(regionCode ?? "") {
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

    private static let english: [String: String] = [
        "app.title": "Travel Glance",
        "location": "Location",
        "altitude": "Altitude",
        "sunset": "Sunset",
        "steps": "Steps",
        "car": "Car",
        "mock.location": "San Francisco",
        "mock.carDistance": "0.8 km"
    ]

    private static let simplifiedChinese: [String: String] = [
        "app.title": "旅行速览",
        "location": "位置",
        "altitude": "海拔",
        "sunset": "日落",
        "steps": "步数",
        "car": "停车点",
        "mock.location": "旧金山",
        "mock.carDistance": "0.8 公里"
    ]

    private static let traditionalChinese: [String: String] = [
        "app.title": "旅行速覽",
        "location": "位置",
        "altitude": "海拔",
        "sunset": "日落",
        "steps": "步數",
        "car": "停車點",
        "mock.location": "舊金山",
        "mock.carDistance": "0.8 公里"
    ]
}
