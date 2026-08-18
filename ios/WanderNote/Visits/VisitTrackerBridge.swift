import Foundation
import React

@objc(VisitTrackerBridge)
final class VisitTrackerBridge: NSObject {
  @objc
  static func requiresMainQueueSetup() -> Bool {
    true
  }

  @objc(getStatus:rejecter:)
  func getStatus(
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      resolve([
        "authorization": VisitTracker.shared.authorizationName(),
        "enabled": VisitTracker.shared.isEnabled,
      ])
    }
  }

  @objc(requestAlwaysAuthorization:rejecter:)
  func requestAlwaysAuthorization(
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      VisitTracker.shared.requestAlwaysAuthorization { status in
        resolve(status)
      }
    }
  }

  /// Resolves nil when monitoring started, or a reason string when it did not.
  @objc(start:rejecter:)
  func start(
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      resolve(VisitTracker.shared.start())
    }
  }

  @objc(stop:rejecter:)
  func stop(
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      VisitTracker.shared.stop()
      resolve(nil)
    }
  }

  @objc(getVisits:rejecter:)
  func getVisits(
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      resolve(VisitTracker.shared.storedVisits())
    }
  }

  @objc(clearVisits:rejecter:)
  func clearVisits(
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      VisitTracker.shared.clearVisits()
      resolve(nil)
    }
  }
}
