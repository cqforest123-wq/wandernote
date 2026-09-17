import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { fetchCurrentWeather } from '../weather';
import {
  makeOutdoorGlanceSnapshotInputFromAppState,
  selectOutdoorGlanceTrip,
} from './OutdoorGlanceAppStateAdapter';
import { OutdoorGlanceSyncCoordinator } from './OutdoorGlanceSyncCoordinator';
import { publishOutdoorGlanceSnapshotJson } from './OutdoorGlanceNativeModule';

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

export default function OutdoorGlanceSync({ trips, loaded, language }) {
  const [weather, setWeather] = useState(null);
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
      return () => {
        cancelled = true;
      };
    }

    const lat = Number(activeTrip.coords.lat);
    const lng = Number(activeTrip.coords.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return () => {
        cancelled = true;
      };
    }

    fetchCurrentWeather(lat, lng, 'auto', language || 'zh')
      .then(result => {
        if (!cancelled) {
          setWeather(makeWeatherDraft(result));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setWeather(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [loaded, coordinateKey, language, activeTrip]);

  const snapshotInput = useMemo(
    () =>
      makeOutdoorGlanceSnapshotInputFromAppState({
        trips,
        weather,
      }),
    [trips, weather]
  );

  useEffect(() => {
    const coordinator = coordinatorRef.current;
    if (!loaded || !coordinator) {
      return;
    }

    coordinator.schedule(snapshotInput);
  }, [loaded, snapshotInput]);

  useEffect(() => {
    const coordinator = coordinatorRef.current;
    if (!coordinator) {
      return undefined;
    }

    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active' && loaded) {
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
