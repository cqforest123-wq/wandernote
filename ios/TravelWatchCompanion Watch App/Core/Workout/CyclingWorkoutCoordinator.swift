import Foundation
import HealthKit
import Combine

private enum CyclingWorkoutDiagnostics {
    nonisolated static func log(_ message: @autoclosure () -> String) {
        #if DEBUG
        print("[WatchGlance] \(message())")
        #endif
    }
}

enum CyclingWorkoutStatus: Equatable {
    case inactive
    case starting
    case active(startedAt: Date)
    case ending
    case failed(String)
}

@MainActor
final class CyclingWorkoutCoordinator: NSObject, ObservableObject {
    static let shared = CyclingWorkoutCoordinator()

    @Published private(set) var status: CyclingWorkoutStatus = .inactive

    private let healthStore: HKHealthStore
    private var session: HKWorkoutSession?
    private var builder: HKLiveWorkoutBuilder?
    private var transitionTimeout: Task<Void, Never>?

    init(
        healthStore: HKHealthStore = HKHealthStore()
    ) {
        self.healthStore = healthStore
        super.init()
    }

    func start(
        from configuration: HKWorkoutConfiguration
    ) {
        guard configuration.activityType == .cycling,
              configuration.locationType == .outdoor else {
            CyclingWorkoutDiagnostics.log(
                "ignored non-cycling workout configuration"
            )
            return
        }

        switch status {
        case .inactive, .failed:
            break
        case .starting, .active, .ending:
            CyclingWorkoutDiagnostics.log(
                "cycling workout start skipped because one is in progress"
            )
            return
        }

        status = .starting
        requestAuthorizationAndStart()
    }

    func endWorkout() {
        guard case .active = status, let session else { return }

        CyclingWorkoutDiagnostics.log(
            "ending cycling workout from Watch UI"
        )
        status = .ending
        scheduleTimeout(for: session)
        session.end()
    }

    private func requestAuthorizationAndStart() {
        guard HKHealthStore.isHealthDataAvailable() else {
            CyclingWorkoutDiagnostics.log(
                "cycling workout unavailable because HealthKit is unavailable"
            )
            status = .failed(WatchStrings.text("workout.unavailable"))
            return
        }

        healthStore.requestAuthorization(
            toShare: [HKObjectType.workoutType()],
            read: []
        ) { [weak self] success, error in
            Task { @MainActor [weak self] in
                guard let self else {
                    return
                }

                guard self.status == .starting else { return }
                // A completed authorization request does not mean access was granted.
                guard success,
                      self.healthStore.authorizationStatus(for: HKObjectType.workoutType()) == .sharingAuthorized else {
                    CyclingWorkoutDiagnostics.log(
                        "cycling workout authorization failed: \(String(describing: error))"
                    )
                    self.status = .failed(WatchStrings.text("workout.permissionDenied"))
                    return
                }

                self.startSession()
            }
        }
    }

    private func startSession() {
        do {
            let configuration = HKWorkoutConfiguration()
            configuration.activityType = .cycling
            configuration.locationType = .outdoor
            let nextSession = try HKWorkoutSession(
                healthStore: healthStore,
                configuration: configuration
            )
            let nextBuilder = nextSession.associatedWorkoutBuilder()
            nextBuilder.dataSource = HKLiveWorkoutDataSource(
                healthStore: healthStore,
                workoutConfiguration: configuration
            )

            session = nextSession
            builder = nextBuilder
            nextSession.delegate = self
            nextBuilder.delegate = self

            let startDate = Date()
            scheduleTimeout(for: nextSession)
            nextSession.startActivity(with: startDate)
            nextBuilder.beginCollection(withStart: startDate) { [weak self] success, error in
                Task { @MainActor [weak self] in
                    guard let self, self.session === nextSession,
                          self.status == .starting else { return }
                    guard success else {
                        CyclingWorkoutDiagnostics.log(
                            "cycling workout collection failed: \(String(describing: error))"
                        )
                        self.failSession(nextSession)
                        return
                    }
                    self.transitionTimeout?.cancel()
                    self.status = .active(startedAt: startDate)
                    CyclingWorkoutDiagnostics.log("cycling workout collection started")
                }
            }

            CyclingWorkoutDiagnostics.log(
                "cycling workout session started"
            )
        } catch {
            CyclingWorkoutDiagnostics.log(
                "cycling workout session start failed: \(String(describing: error))"
            )
            status = .failed(WatchStrings.text("workout.unavailable"))
        }
    }

    private func finishWorkout(
        session endingSession: HKWorkoutSession,
        endedAt endDate: Date
    ) {
        guard session === endingSession, let builder else { return }
        if case .ending = status { } else {
            status = .ending
            scheduleTimeout(for: endingSession)
        }

        builder.endCollection(withEnd: endDate) { [weak self] success, error in
            Task { @MainActor [weak self] in
                guard let self, self.session === endingSession else { return }
                guard success else {
                    CyclingWorkoutDiagnostics.log(
                        "cycling workout end collection failed: \(String(describing: error))"
                    )
                    self.failSession(endingSession, messageKey: "workout.saveFailed")
                    return
                }
                Task { @MainActor [weak self] in
                    do {
                        _ = try await builder.finishWorkout()
                        guard let self, self.session === endingSession else { return }
                        self.transitionTimeout?.cancel()
                        self.session = nil
                        self.builder = nil
                        self.status = .inactive
                        CyclingWorkoutDiagnostics.log("cycling workout saved")
                    } catch {
                        self?.failSession(endingSession, messageKey: "workout.saveFailed")
                    }
                }
            }
        }
    }

    private func scheduleTimeout(for pendingSession: HKWorkoutSession) {
        transitionTimeout?.cancel()
        transitionTimeout = Task { [weak self] in
            do { try await Task.sleep(for: .seconds(30)) } catch { return }
            guard let self, self.session === pendingSession else { return }
            self.failSession(pendingSession)
        }
    }

    private func failSession(
        _ failedSession: HKWorkoutSession,
        messageKey: String = "workout.unavailable"
    ) {
        guard session === failedSession else { return }
        transitionTimeout?.cancel()
        let failedBuilder = builder
        session = nil
        builder = nil
        status = .failed(WatchStrings.text(messageKey))
        failedSession.end()
        failedBuilder?.discardWorkout()
    }
}

extension CyclingWorkoutCoordinator: HKWorkoutSessionDelegate {
    nonisolated func workoutSession(
        _ workoutSession: HKWorkoutSession,
        didChangeTo toState: HKWorkoutSessionState,
        from fromState: HKWorkoutSessionState,
        date: Date
    ) {
        if toState == .ended {
            Task { @MainActor [weak self] in
                self?.finishWorkout(session: workoutSession, endedAt: date)
            }
        }
    }

    nonisolated func workoutSession(
        _ workoutSession: HKWorkoutSession,
        didFailWithError error: Error
    ) {
        Task { @MainActor [weak self] in
            CyclingWorkoutDiagnostics.log(
                "cycling workout session failed: \(String(describing: error))"
            )
            self?.failSession(workoutSession)
        }
    }
}

extension CyclingWorkoutCoordinator: HKLiveWorkoutBuilderDelegate {
    nonisolated func workoutBuilderDidCollectEvent(
        _ workoutBuilder: HKLiveWorkoutBuilder
    ) {}

    nonisolated func workoutBuilder(
        _ workoutBuilder: HKLiveWorkoutBuilder,
        didCollectDataOf collectedTypes: Set<HKSampleType>
    ) {}
}
