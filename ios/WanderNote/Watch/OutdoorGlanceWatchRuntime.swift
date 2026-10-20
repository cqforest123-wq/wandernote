import Foundation

final class OutdoorGlanceWatchRuntime {
  static let shared = OutdoorGlanceWatchRuntime()

  private let sender = OutdoorGlanceWatchSender()

  private init() {}

  func start() {
    sender.start()
  }

  func publish(encodedData data: Data) throws {
    try sender.publish(encodedData: data)
  }
}
