import { NativeModules, Platform } from 'react-native';
import { logEvent } from './diagnostics';

const bridge = NativeModules.VisitTrackerBridge;

/**
 * Automatic footprints, from Core Location's visit monitoring.
 *
 * Records only that the user stopped somewhere and for how long — not a
 * continuous track. That costs almost no battery, needs no background mode,
 * and produces the thing a travel journal actually wants: "two hours here",
 * rather than the path in between.
 *
 * Off unless the user turns it on. Nothing is ever uploaded.
 */

export const VISIT_UNSUPPORTED = 'unsupported';

export function visitsSupported() {
  return Platform.OS === 'ios' && !!bridge;
}

export async function getVisitStatus() {
  if (!visitsSupported()) {
    return { authorization: VISIT_UNSUPPORTED, enabled: false };
  }

  try {
    return await bridge.getStatus();
  } catch (e) {
    return { authorization: 'unknown', enabled: false };
  }
}

/**
 * @returns null when monitoring started, or a reason string when it did not.
 */
export async function enableVisitTracking() {
  if (!visitsSupported()) return VISIT_UNSUPPORTED;

  try {
    const authorization = await bridge.requestAlwaysAuthorization();
    const reason = await bridge.start();

    logEvent('visits', reason ? 'start-refused' : 'started', {
      authorization,
      ...(reason ? { reason } : {}),
    });

    return reason ?? null;
  } catch (e) {
    logEvent('visits', 'start-failed', {
      message: String(e?.message || e).slice(0, 60),
    });
    return 'error';
  }
}

export async function disableVisitTracking() {
  if (!visitsSupported()) return;

  try {
    await bridge.stop();
    logEvent('visits', 'stopped', {});
  } catch (e) {
    // Nothing useful to do; the preference is already off on the native side.
  }
}

export async function loadVisits() {
  if (!visitsSupported()) return [];

  try {
    const raw = await bridge.getVisits();

    return Array.isArray(raw) ? raw.map(normalizeVisit).filter(Boolean) : [];
  } catch (e) {
    return [];
  }
}

export async function clearVisits() {
  if (!visitsSupported()) return;

  try {
    await bridge.clearVisits();
  } catch (e) {
    // Same as above.
  }
}

function normalizeVisit(raw) {
  const lat = Number(raw?.latitude);
  const lng = Number(raw?.longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat === 0 && lng === 0) return null;

  const arrivalAt = Number(raw?.arrivalAt);
  const departureAt = Number(raw?.departureAt);

  return {
    coords: { lat, lng },
    // Seconds on the native side, milliseconds everywhere in JS.
    arrivalAt: Number.isFinite(arrivalAt) ? arrivalAt * 1000 : null,
    departureAt: Number.isFinite(departureAt) ? departureAt * 1000 : null,
    accuracy: Number.isFinite(Number(raw?.accuracy)) ? Number(raw.accuracy) : null,
  };
}
