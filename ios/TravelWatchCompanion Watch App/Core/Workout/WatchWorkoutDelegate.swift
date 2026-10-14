import HealthKit
import WatchKit

final class WatchWorkoutDelegate: NSObject, WKApplicationDelegate {
    func handle(
        _ workoutConfiguration: HKWorkoutConfiguration
    ) {
        Task { @MainActor in
            CyclingWorkoutCoordinator.shared.start(
                from: workoutConfiguration
            )
        }
    }
}
