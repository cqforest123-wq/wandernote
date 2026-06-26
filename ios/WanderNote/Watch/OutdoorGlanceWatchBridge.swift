import Foundation
import React

@objc(OutdoorGlanceWatchBridge)
final class OutdoorGlanceWatchBridge: NSObject {
  @objc
  static func requiresMainQueueSetup() -> Bool {
    false
  }

  @objc(publishOutdoorGlanceSnapshot:resolver:rejecter:)
  func publishOutdoorGlanceSnapshot(
    _ snapshotJson: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard let data = snapshotJson.data(using: .utf8) else {
      reject(
        "ERR_OUTDOOR_GLANCE_INVALID_JSON",
        "Outdoor glance snapshot JSON could not be encoded as UTF-8.",
        nil
      )
      return
    }

    do {
      try OutdoorGlanceWatchRuntime.shared.publish(encodedData: data)
      resolve(nil)
    } catch let error as OutdoorGlanceWatchSenderError {
      reject(error.bridgeCode, error.localizedDescription, error as NSError)
    } catch {
      reject(
        "ERR_OUTDOOR_GLANCE_PUBLISH_FAILED",
        "Outdoor glance snapshot could not be published.",
        error as NSError
      )
    }
  }
}
