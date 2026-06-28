import { NativeModules, Platform } from 'react-native';

const MODULE_NAME = 'OutdoorGlanceWatchBridge';

function logOutdoorGlanceDebug(message) {
  if (globalThis.__DEV__) {
    console.debug(`[OutdoorGlance] ${message}`);
  }
}

export async function publishOutdoorGlanceSnapshotJson(snapshotJson) {
  if (Platform.OS !== 'ios') {
    logOutdoorGlanceDebug('native bridge skipped on non-iOS platform');
    return false;
  }

  const bridge = NativeModules?.[MODULE_NAME];
  if (typeof bridge?.publishOutdoorGlanceSnapshot !== 'function') {
    logOutdoorGlanceDebug('native bridge unavailable; skipping send');
    return false;
  }

  logOutdoorGlanceDebug('native bridge send requested');
  await bridge.publishOutdoorGlanceSnapshot(snapshotJson);
  return true;
}
