import { NativeModules, Platform } from 'react-native';
import { logEvent } from '../diagnostics';

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
    // "scheduled" only ever meant we handed it to the coordinator. Whether it
    // reached the watch was never recorded, which is why a watch stuck in
    // Daily mode looked like a watch-side problem for so long.
    logEvent('watch-send', 'no-bridge', {});
    return false;
  }

  logOutdoorGlanceDebug('native bridge send requested');

  try {
    const status = await bridge.publishOutdoorGlanceSnapshot(snapshotJson);
    logEvent('watch-send', status === 'sent' ? 'sent' : 'queued', {
      status: String(status ?? 'unknown'),
      bytes: snapshotJson?.length ?? 0,
    });
    return true;
  } catch (error) {
    logEvent('watch-send', 'failed', {
      message: String(error?.message || error).slice(0, 80),
    });
    return false;
  }
}
