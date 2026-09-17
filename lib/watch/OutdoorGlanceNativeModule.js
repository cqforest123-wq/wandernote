import { NativeModules, Platform } from 'react-native';

const MODULE_NAME = 'OutdoorGlanceWatchBridge';

export async function publishOutdoorGlanceSnapshotJson(snapshotJson) {
  if (Platform.OS !== 'ios') {
    return false;
  }

  const bridge = NativeModules?.[MODULE_NAME];
  if (typeof bridge?.publishOutdoorGlanceSnapshot !== 'function') {
    return false;
  }

  await bridge.publishOutdoorGlanceSnapshot(snapshotJson);
  return true;
}
