import Foundation
import HealthKit
import WatchConnectivity

enum CyclingWorkoutWatchLauncherError: Error, Equatable {
  case healthDataUnavailable
  case watchUnavailable
  case launchFailed(String)

  var bridgeCode: String {
    switch self {
    case .healthDataUnavailable:
      return "ERR_CYCLING_WORKOUT_HEALTH_UNAVAILABLE"
    case .watchUnavailable:
      return "ERR_CYCLING_WORKOUT_WATCH_UNAVAILABLE"
    case .launchFailed:
      return "ERR_CYCLING_WORKOUT_WATCH_LAUNCH_FAILED"
    }
  }
}

extension CyclingWorkoutWatchLauncherError: LocalizedError {
  var errorDescription: String? {
    switch self {
    case .healthDataUnavailable:
      return "Health data is not available on this iPhone."
    case .watchUnavailable:
      return "A paired Apple Watch with WanderNote installed is required."
    case let .launchFailed(message):
      return "Apple Watch cycling workout could not be started: \(message)"
    }
  }
}

final class CyclingWorkoutWatchLauncher {
  private let healthStore: HKHealthStore

  init(healthStore: HKHealthStore = HKHealthStore()) {
    self.healthStore = healthStore
  }

  func startOutdoorCyclingWorkout(
    completion: @escaping (Result<Void, CyclingWorkoutWatchLauncherError>) -> Void
  ) {
    guard HKHealthStore.isHealthDataAvailable() else {
      OutdoorGlanceWatchDiagnostics.log(
        "cycling workout launch skipped because HealthKit is unavailable"
      )
      completion(.failure(.healthDataUnavailable))
      return
    }

    guard WCSession.isSupported(),
          WCSession.default.activationState == .activated,
          WCSession.default.isPaired,
          WCSession.default.isWatchAppInstalled else {
      completion(.failure(.watchUnavailable))
      return
    }

    let configuration = HKWorkoutConfiguration()
    configuration.activityType = .cycling
    configuration.locationType = .outdoor

    OutdoorGlanceWatchDiagnostics.log(
      "requesting Apple Watch outdoor cycling workout launch"
    )

    healthStore.startWatchApp(with: configuration) { success, error in
      if success {
        OutdoorGlanceWatchDiagnostics.log(
          "Apple Watch outdoor cycling workout launch requested"
        )
        completion(.success(()))
        return
      }

      let message = error?.localizedDescription ?? "Unknown launch failure."
      OutdoorGlanceWatchDiagnostics.log(
        "Apple Watch outdoor cycling workout launch failed: \(message)"
      )
      completion(.failure(.launchFailed(message)))
    }
  }
}
