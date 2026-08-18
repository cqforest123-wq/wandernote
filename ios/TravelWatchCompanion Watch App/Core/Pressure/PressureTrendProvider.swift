import CoreMotion
import Foundation

/// Barometric pressure from the watch's altimeter.
///
/// Needs no permission — the barometer is not a privacy-gated sensor — and no
/// network, which is exactly when it earns its place.
@MainActor
final class PressureTrendProvider {
    private let altimeter = CMAltimeter()
    private var history: [PressureReading] = []
    private var isRunning = false

    /// (kilopascals, falling?) — `nil` trend means steady or not enough history.
    var onUpdate: ((Double, Bool?) -> Void)?

    static var isSupported: Bool {
        CMAltimeter.isRelativeAltitudeAvailable()
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
