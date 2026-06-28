import Combine
import Foundation

@MainActor
final class DailyGlanceStore: ObservableObject {
    @Published private(set) var data: DailyGlanceData

    init(
        data: DailyGlanceData = .empty()
    ) {
        self.data = data
    }

    func start() {
        refreshClock()
    }

    func refreshClock(
        at date: Date = Date()
    ) {
        data = data.updatingClock(at: date)
    }
}
