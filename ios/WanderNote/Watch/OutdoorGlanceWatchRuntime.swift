import Foundation

final class OutdoorGlanceWatchRuntime {
  static let shared = OutdoorGlanceWatchRuntime()

  private let sender = OutdoorGlanceWatchSender()

  private init() {}

  func start() {
    sender.start()
  }

  @discardableResult
  func publish(encodedData data: Data) throws -> String {
    try sender.publish(encodedData: data)
  }
}
