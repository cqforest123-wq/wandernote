import SwiftUI
import WatchKit

@main
struct TravelWatchCompanionApp: App {
    @Environment(\.scenePhase) private var scenePhase
    @WKApplicationDelegateAdaptor(WatchWorkoutDelegate.self) private var workoutDelegate
    @StateObject private var runtime = WatchCompanionRuntime()
    @StateObject private var cyclingWorkoutCoordinator = CyclingWorkoutCoordinator.shared

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(runtime.store)
                .environmentObject(runtime.dailyStore)
                .environmentObject(cyclingWorkoutCoordinator)
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
