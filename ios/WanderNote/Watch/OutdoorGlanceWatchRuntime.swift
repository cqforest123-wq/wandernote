import Foundation

final class OutdoorGlanceWatchRuntime {
  static let shared = OutdoorGlanceWatchRuntime()

  private let sender = OutdoorGlanceWatchSender()
  private let cyclingWorkoutLauncher = CyclingWorkoutWatchLauncher()

  private init() {}

  func start() {
    sender.start()
  }

  func publish(encodedData data: Data) throws {
    try sender.publish(encodedData: data)
  }

  func startOutdoorCyclingWorkoutOnWatch(
    completion: @escaping (Result<Void, CyclingWorkoutWatchLauncherError>) -> Void
  ) {
    cyclingWorkoutLauncher.startOutdoorCyclingWorkout(
      completion: completion
    )
  }
}
