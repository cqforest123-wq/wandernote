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

export async function startOutdoorCyclingWorkoutOnWatch() {
  if (Platform.OS !== 'ios') {
    return false;
  }

  const bridge = NativeModules?.[MODULE_NAME];
  if (typeof bridge?.startOutdoorCyclingWorkoutOnWatch !== 'function') {
    return false;
  }

  let timeout;
  try {
    await Promise.race([
      bridge.startOutdoorCyclingWorkoutOnWatch(),
      new Promise((_, reject) => {
        timeout = setTimeout(() => {
          reject(new Error('Apple Watch start request timed out.'));
        }, 20000);
      }),
    ]);
  } finally {
    clearTimeout(timeout);
  }
  return true;
}
