import SwiftUI
import WatchKit

@main
struct TravelWatchCompanionApp: App {
    @Environment(\.scenePhase) private var scenePhase
    @WKApplicationDelegateAdaptor(WatchAppDelegate.self) private var appDelegate
    @StateObject private var runtime = WatchCompanionRuntime()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(runtime.store)
                .environmentObject(runtime.dailyStore)
                .task {
                    runtime.start()
                    // Granted background windows refresh the local readings so
                    // the next wrist-raise opens on current numbers instead of
                    // filling in while being watched.
                    appDelegate.onBackgroundRefresh = { [runtime] in
                        Task { @MainActor in
                            runtime.refreshActiveData()
                        }
                    }
                }
                .onChange(of: scenePhase) { newPhase in
                    if newPhase == .active {
                        runtime.refreshActiveData()
                    }
                }
        }
    }
}
