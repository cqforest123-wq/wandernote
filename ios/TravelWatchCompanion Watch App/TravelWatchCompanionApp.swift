import SwiftUI

@main
struct TravelWatchCompanionApp: App {
    @StateObject private var runtime = WatchCompanionRuntime()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(runtime.store)
                .task {
                    runtime.start()
                }
        }
    }
}
