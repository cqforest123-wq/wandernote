import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { getLocales } from 'expo-localization';
import { fetchCurrentWeather } from '../weather';
import { logEvent } from '../diagnostics';
import {
  formatMoney,
  getHomeCurrency,
  getUnitPreference,
  loadRates,
  sumExpenses,
} from '../currency';
import {
  makeOutdoorGlanceSnapshotInputFromAppState,
  selectOutdoorGlanceTrip,
} from './OutdoorGlanceAppStateAdapter';
import { OutdoorGlanceSyncCoordinator } from './OutdoorGlanceSyncCoordinator';
import { publishOutdoorGlanceSnapshotJson } from './OutdoorGlanceNativeModule';

function logOutdoorGlanceDebug(message) {
  if (globalThis.__DEV__) {
    console.debug(`[OutdoorGlance] ${message}`);
  }
}

function makeCoordinateKey(trip) {
  if (!trip?.coords) {
    return '';
  }

  return `${trip.coords.lat ?? ''},${trip.coords.lng ?? ''}`;
}

function makeWeatherDraft(weather) {
  if (!weather) {
    return null;
  }

  return {
    temperatureCelsius: weather.temp ?? null,
    apparentTemperatureCelsius: null,
    conditionCode: weather.code == null ? null : String(weather.code),
    precipitationProbability: null,
    updatedAt: new Date(),
  };
}

/** Today's date in the `YYYY.MM.DD` form the day records use. */
function todayKey(now = new Date()) {
  const pad = n => String(n).padStart(2, '0');

  return `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())}`;
}

/**
 * What the wearer has spent today, formatted in their home currency.
 *
 * Returns null when nothing was spent or when no rate could convert what was —
 * the watch then simply omits the row rather than showing a total that is
 * quietly missing entries.
 */
function makeTodaySpendText(trips, homeCurrency, rates, now = new Date()) {
  if (!homeCurrency) {
    return null;
  }

  const key = todayKey(now);
  const expenses = [];

  for (const trip of trips || []) {
    for (const day of trip?.days || []) {
      if (day?.date === key) {
        expenses.push(...(day.expenses || []));
      }
    }
  }

  if (expenses.length === 0) {
    return null;
  }

  const { total, unconvertible } = sumExpenses(expenses, homeCurrency, rates);

  if (unconvertible.length > 0 || !(total > 0)) {
    return null;
  }

  return formatMoney(total, homeCurrency);
}

/**
 * Whether the wearer's region uses metric.
 *
 * Decided here rather than on the watch: this bundle has proper localizations
 * so its locale is trustworthy, while the watch bundle keeps degrading
 * Locale.current to its development language and reporting imperial.
 */
/** The raw measurement system expo-localization reports, for diagnostics. */
function regionMeasurementSystem() {
  const locale = getLocales()?.[0];

  if (!locale) {
    return 'no-locale';
  }

  if (typeof locale.measurementSystem === 'string') {
    return locale.measurementSystem;
  }

  return `metric-flag:${String(locale.metric)}`;
}

function regionUsesMetric() {
  const locale = getLocales()?.[0];

  if (!locale) {
    return true;
  }

  if (typeof locale.measurementSystem === 'string') {
    return locale.measurementSystem !== 'us' && locale.measurementSystem !== 'uk';
  }

  // Older expo-localization exposes the flag instead of the system name.
  return locale.metric !== false;
}

export default function OutdoorGlanceSync({ trips, loaded, language }) {
  const [weather, setWeather] = useState(null);
  const [money, setMoney] = useState(null);
  const activeTrip = useMemo(() => selectOutdoorGlanceTrip(trips), [trips]);
  const coordinateKey = makeCoordinateKey(activeTrip);
  const coordinatorRef = useRef(null);

  if (!coordinatorRef.current) {
    coordinatorRef.current = new OutdoorGlanceSyncCoordinator({
      publisher: publishOutdoorGlanceSnapshotJson,
      onError: error => {
        console.warn('Outdoor glance sync failed:', error?.message || error);
      },
    });
  }

  useEffect(() => {
    let cancelled = false;

    setWeather(null);

    if (!loaded || !activeTrip?.coords) {
      if (loaded) {
        logEvent('weather', 'skipped', { reason: 'trip-has-no-coords' });
      }
      return () => {
        cancelled = true;
      };
    }

    const lat = Number(activeTrip.coords.lat);
    const lng = Number(activeTrip.coords.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      logEvent('weather', 'skipped', { reason: 'coords-not-numeric' });
      return () => {
        cancelled = true;
      };
    }

    fetchCurrentWeather(lat, lng, 'auto', language || 'zh')
      .then(result => {
        if (!cancelled) {
          logOutdoorGlanceDebug('destination weather resolved for snapshot');
          logEvent('weather', result ? 'fetched' : 'empty-response', {
            hasTemp: !!(result && result.temp != null),
          });
          setWeather(makeWeatherDraft(result));
        }
      })
      .catch((error) => {
        if (!cancelled) {
          logOutdoorGlanceDebug('destination weather unavailable for snapshot');
          logEvent('weather', 'fetch-failed', {
            message: String(error?.message || 'unknown').slice(0, 60),
          });
          setWeather(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [loaded, coordinateKey, language, activeTrip]);

  useEffect(() => {
    let cancelled = false;

    Promise.all([getHomeCurrency(), loadRates(), getUnitPreference()])
      .then(([homeCurrency, rates, units]) => {
        if (!cancelled) {
          setMoney({ homeCurrency, rates, units });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMoney(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [loaded]);

  const todaySpendText = useMemo(
    () =>
      money
        ? makeTodaySpendText(trips, money.homeCurrency, money.rates)
        : null,
    [trips, money]
  );

  const snapshotInput = useMemo(
    () =>
      makeOutdoorGlanceSnapshotInputFromAppState({
        trips,
        weather,
        language,
        todaySpendText,
        // An explicit choice wins; 'auto' falls back to the device region.
        usesMetric:
          money?.units === 'metric'
            ? true
            : money?.units === 'imperial'
              ? false
              : regionUsesMetric(),
      }),
    [trips, weather, language, todaySpendText, money]
  );

  useEffect(() => {
    const coordinator = coordinatorRef.current;
    if (!loaded || !coordinator) {
      return;
    }

    coordinator.schedule(snapshotInput);
    logOutdoorGlanceDebug('snapshot input scheduled from app state');
    // Log what survives normalisation, not what went in: the input carried a
    // trip while the composed snapshot had dropped it, and that gap hid the
    // real fault for hours.
    logEvent('watch-sync', 'scheduled', {
      hasTrip: !!snapshotInput.trip,
      tripNamed: !!String(snapshotInput.trip?.name || '').trim(),
      hasWeather: !!snapshotInput.weather,
      hasSpend: !!snapshotInput.todaySpendText,
      metric: snapshotInput.usesMetric,
      // Where that boolean came from. 'auto' means it was derived from the
      // device *region*, which is not the same thing as the device language —
      // an iPhone set to United States reports imperial no matter what
      // language the app is running in.
      units: money?.units || 'pending',
      region: regionMeasurementSystem(),
    });
  }, [loaded, snapshotInput]);

  useEffect(() => {
    const coordinator = coordinatorRef.current;
    if (!coordinator) {
      return undefined;
    }

    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active' && loaded) {
        logOutdoorGlanceDebug('foreground resync requested');
        coordinator.schedule(snapshotInput, { force: true });
      }
    });

    return () => subscription.remove();
  }, [loaded, snapshotInput]);

  useEffect(() => {
    const coordinator = coordinatorRef.current;
    return () => coordinator?.dispose();
  }, []);

  return null;
}
