#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(OutdoorGlanceWatchBridge, NSObject)

RCT_EXTERN_METHOD(publishOutdoorGlanceSnapshot:(NSString *)snapshotJson
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
