import SwiftUI

struct ContentView: View {
    @EnvironmentObject private var store: OutdoorGlanceSnapshotStore
    @EnvironmentObject private var dailyStore: DailyGlanceStore
    @EnvironmentObject private var cyclingWorkoutCoordinator: CyclingWorkoutCoordinator

    var body: some View {
        TimelineView(.periodic(from: .now, by: 60)) { context in
            ScrollView {
                GlanceContentView(
                    glance: glance(at: context.date),
                    canRecordParking: canRecordParking,
                    workoutStatus: cyclingWorkoutCoordinator.status,
                    onEndWorkout: {
                        cyclingWorkoutCoordinator.endWorkout()
                    },
                    onSaveParking: {
                        dailyStore.recordParkingAtCurrentLocation()
                    }
                )
                .padding()
            }
        }
    }

    private func glance(at date: Date) -> GlanceData {
        GlanceDataMapper.make(
            snapshot: store.snapshot,
            availability: store.availability(at: date),
            dailyData: dailyStore.data,
            at: date
        )
    }

    private var canRecordParking: Bool {
        dailyStore.data.locationAuthorization == .authorized &&
            dailyStore.data.latitude != nil &&
            dailyStore.data.longitude != nil
    }
}
