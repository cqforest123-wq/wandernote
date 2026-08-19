import CoreMotion
import Foundation

/// Barometric pressure from the watch's altimeter.
///
/// Motion *is* privacy-gated, contrary to what it looks like: starting altimeter
/// updates without `NSMotionUsageDescription` in the Info.plist crashes the app
/// on launch. The authorization state is also checked here, because a denied
/// sensor should cost one hidden row, never the whole app.
///
/// It needs no network though, which is exactly when it earns its place.
@MainActor
final class PressureTrendProvider {
    private let altimeter = CMAltimeter()
    private var history: [PressureReading] = []
    private var isRunning = false

    /// (kilopascals, falling?) — `nil` trend means steady or not enough history.
    var onUpdate: ((Double, Bool?) -> Void)?

    static var isSupported: Bool {
        guard CMAltimeter.isRelativeAltitudeAvailable() else {
            return false
        }

        switch CMAltimeter.authorizationStatus() {
        case .denied, .restricted:
            return false
        case .authorized, .notDetermined:
            return true
        @unknown default:
            return false
        }
    }

    func start() {
        guard !isRunning, Self.isSupported else {
            return
        }

        isRunning = true
        history = PressureHistoryStore.load()

        altimeter.startRelativeAltitudeUpdates(to: .main) { [weak self] data, _ in
            guard let data else {
                return
            }

            Task { @MainActor [weak self] in
                self?.record(kilopascals: data.pressure.doubleValue)
            }
        }
    }

    func stop() {
        guard isRunning else {
            return
        }

        isRunning = false
        altimeter.stopRelativeAltitudeUpdates()
    }

    private func record(kilopascals: Double, now: Date = Date()) {
        history = PressureHistoryStore.appending(
            PressureReading(kilopascals: kilopascals, at: now),
            to: history,
            now: now
        )
        PressureHistoryStore.save(history)

        onUpdate?(kilopascals, PressureTrend.falling(in: history, now: now))
    }
}
