import Foundation
import HealthKit

private enum ActivityStepDiagnostics {
    static func log(_ message: @autoclosure () -> String) {
        #if DEBUG
        print("[WatchGlance] \(message())")
        #endif
    }
}

struct ActivityStepUpdate: Equatable {
    let stepsToday: Int?
}

@MainActor
final class ActivityStepProvider {
    var onUpdate: ((ActivityStepUpdate) -> Void)?

    private let healthStore: HKHealthStore?
    private var hasRequestedAuthorization = false
    private var observerQuery: HKObserverQuery?

    init(
        healthStore: HKHealthStore? = nil,
        useDefaultStore: Bool = true
    ) {
        if let healthStore {
            self.healthStore = healthStore
        } else if useDefaultStore && HKHealthStore.isHealthDataAvailable() {
            self.healthStore = HKHealthStore()
        } else {
            self.healthStore = nil
        }
    }

    func start() {
        ActivityStepDiagnostics.log(
            "HealthKit step provider starting"
        )
        requestAuthorizationIfNeeded()
    }

    func refresh() {
        guard hasRequestedAuthorization else {
            requestAuthorizationIfNeeded()
            return
        }

        querySteps()
    }

    private func requestAuthorizationIfNeeded() {
        guard let healthStore,
              let stepType = HKQuantityType.quantityType(
                forIdentifier: .stepCount
              ) else {
            ActivityStepDiagnostics.log(
                "HealthKit unavailable for step count"
            )
            publish(stepsToday: nil)
            return
        }

        guard !hasRequestedAuthorization else {
            querySteps()
            return
        }

        hasRequestedAuthorization = true
        healthStore.requestAuthorization(
            toShare: [],
            read: [stepType]
        ) { [weak self] success, _ in
            guard let self else {
                return
            }

            Task { @MainActor in
                if success {
                    ActivityStepDiagnostics.log(
                        "HealthKit authorization request completed for step count"
                    )
                    self.startObservingSteps(
                        stepType: stepType
                    )
                    self.querySteps()
                } else {
                    ActivityStepDiagnostics.log(
                        "HealthKit authorization denied for step count"
                    )
                    self.publish(stepsToday: nil)
                }
            }
        }
    }

    private func startObservingSteps(
        stepType: HKQuantityType
    ) {
        guard observerQuery == nil,
              let healthStore else {
            return
        }

        let query = HKObserverQuery(
            sampleType: stepType,
            predicate: nil
        ) { [weak self] _, completionHandler, error in
            if let error {
                ActivityStepDiagnostics.log(
                    "HealthKit step observer failed: \(String(describing: error))"
                )
                completionHandler()
                return
            }

            guard let self else {
                completionHandler()
                return
            }

            Task { @MainActor in
                self.querySteps()
                completionHandler()
            }
        }

        observerQuery = query
        healthStore.execute(query)
        ActivityStepDiagnostics.log(
            "HealthKit step observer started"
        )
    }

    private func querySteps(
        now: Date = Date()
    ) {
        guard let healthStore,
              let stepType = HKQuantityType.quantityType(
                forIdentifier: .stepCount
              ) else {
            ActivityStepDiagnostics.log(
                "HealthKit unavailable during step refresh"
            )
            publish(stepsToday: nil)
            return
        }

        let calendar = Calendar.current
        let startOfDay = calendar.startOfDay(for: now)
        let predicate = HKQuery.predicateForSamples(
            withStart: startOfDay,
            end: now,
            options: .strictStartDate
        )
        let query = HKStatisticsQuery(
            quantityType: stepType,
            quantitySamplePredicate: predicate,
            options: .cumulativeSum
        ) { [weak self] _, statistics, error in
            guard let self else {
                return
            }

            Task { @MainActor in
                guard error == nil else {
                    ActivityStepDiagnostics.log(
                        "HealthKit step query failed"
                    )
                    self.publish(stepsToday: nil)
                    return
                }

                guard let quantity = statistics?.sumQuantity() else {
                    ActivityStepDiagnostics.log(
                        "HealthKit step query returned no samples"
                    )
                    self.publish(stepsToday: 0)
                    return
                }

                let steps = Int(
                    quantity.doubleValue(for: .count()).rounded()
                )
                ActivityStepDiagnostics.log(
                    "HealthKit step query succeeded"
                )
                self.publish(stepsToday: steps)
            }
        }

        healthStore.execute(query)
    }

    private func publish(
        stepsToday: Int?
    ) {
        onUpdate?(
            ActivityStepUpdate(
                stepsToday: stepsToday
            )
        )
    }
}
