import SwiftUI

@main
struct TravelWatchCompanionApp: App {
    @Environment(\.scenePhase) private var scenePhase
    @StateObject private var runtime = WatchCompanionRuntime()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(runtime.store)
                .environmentObject(runtime.dailyStore)
                .task {
                    runtime.start()
                }
                .onChange(of: scenePhase) { newPhase in
                    if newPhase == .active {
                        runtime.refreshActiveData()
                    }
                }
        }
    }
}
