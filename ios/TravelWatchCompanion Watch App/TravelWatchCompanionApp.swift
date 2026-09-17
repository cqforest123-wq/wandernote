import SwiftUI
import WatchKit

@main
struct TravelWatchCompanionApp: App {
    @StateObject private var runtime = WatchCompanionRuntime()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(runtime.store)
                .environmentObject(runtime.dailyStore)
                .task {
                    runtime.start()
                }
                .onReceive(
                    NotificationCenter.default.publisher(
                        for: WKApplication.didBecomeActiveNotification
                    )
                ) { _ in
                    runtime.refreshActiveData()
                }
        }
    }
}
