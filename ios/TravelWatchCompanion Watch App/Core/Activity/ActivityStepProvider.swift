import Foundation
import HealthKit

struct ActivityStepUpdate: Equatable {
    let stepsToday: Int?
}

@MainActor
final class ActivityStepProvider {
    var onUpdate: ((ActivityStepUpdate) -> Void)?

    private let healthStore: HKHealthStore?
    private var hasRequestedAuthorization = false

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
            Task { @MainActor in
                if success {
                    self?.querySteps()
                } else {
                    self?.publish(stepsToday: nil)
                }
            }
        }
    }

    private func querySteps(
        now: Date = Date()
    ) {
        guard let healthStore,
              let stepType = HKQuantityType.quantityType(
                forIdentifier: .stepCount
              ) else {
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
            Task { @MainActor in
                guard error == nil,
                      let quantity = statistics?.sumQuantity() else {
                    self?.publish(stepsToday: nil)
                    return
                }

                let steps = Int(
                    quantity.doubleValue(for: .count()).rounded()
                )
                self?.publish(stepsToday: steps)
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
