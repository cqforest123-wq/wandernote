import SwiftUI

enum WatchLanguage {
    static var code: String {
        Locale.current.language.languageCode?.identifier ?? "en"
    }

    static func text(_ key: String) -> String {
        let isChinese = code.hasPrefix("zh")

        let en: [String: String] = [
            "app.title": "Travel Glance",
            "location": "Location",
            "altitude": "Altitude",
            "sunset": "Sunset",
            "steps": "Steps",
            "distance": "Distance",
            "car": "Car",
            "mock.location": "San Francisco",
            "mock.sunset": "20:31",
            "mock.distance": "0.8 km"
        ]

        let zhHans: [String: String] = [
            "app.title": "旅行速览",
            "location": "位置",
            "altitude": "海拔",
            "sunset": "日落",
            "steps": "步数",
            "distance": "距离",
            "car": "停车点",
            "mock.location": "旧金山",
            "mock.sunset": "20:31",
            "mock.distance": "0.8 公里"
        ]

        return (isChinese ? zhHans[key] : en[key]) ?? en[key] ?? key
    }
}

struct ContentView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 10) {
                Text(WatchLanguage.text("app.title"))
                    .font(.headline)

                metricRow(
                    title: WatchLanguage.text("location"),
                    value: WatchLanguage.text("mock.location")
                )

                metricRow(
                    title: WatchLanguage.text("altitude"),
                    value: "32 m"
                )

                metricRow(
                    title: WatchLanguage.text("sunset"),
                    value: WatchLanguage.text("mock.sunset")
                )

                metricRow(
                    title: WatchLanguage.text("steps"),
                    value: "13,482"
                )

                metricRow(
                    title: WatchLanguage.text("car"),
                    value: "↖︎ \(WatchLanguage.text("mock.distance"))"
                )
            }
            .padding()
        }
    }

    private func metricRow(title: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title)
                .font(.caption2)
                .foregroundStyle(.secondary)
            Text(value)
                .font(.body)
                .fontWeight(.semibold)
        }
    }
}

#Preview {
    ContentView()
}
