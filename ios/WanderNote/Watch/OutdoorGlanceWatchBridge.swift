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
      OutdoorGlanceWatchDiagnostics.log(
        "native bridge rejected non-UTF8 snapshot JSON"
      )
      reject(
        "ERR_OUTDOOR_GLANCE_INVALID_JSON",
        "Outdoor glance snapshot JSON could not be encoded as UTF-8.",
        nil
      )
      return
    }

    do {
      OutdoorGlanceWatchDiagnostics.log(
        "native bridge send requested"
      )
      // Resolve with what actually happened. "sent" means the watch has it;
      // anything else names the condition that stopped it.
      let status = try OutdoorGlanceWatchRuntime.shared.publish(encodedData: data)
      resolve(status)
    } catch let error as OutdoorGlanceWatchSenderError {
      OutdoorGlanceWatchDiagnostics.log(
        "native bridge send failed: \(error.bridgeCode)"
      )
      reject(error.bridgeCode, error.localizedDescription, error as NSError)
    } catch {
      OutdoorGlanceWatchDiagnostics.log(
        "native bridge send failed with unexpected error"
      )
      reject(
        "ERR_OUTDOOR_GLANCE_PUBLISH_FAILED",
        "Outdoor glance snapshot could not be published.",
        error as NSError
      )
    }
  }
}
