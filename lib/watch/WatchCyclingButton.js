import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { startOutdoorCyclingWorkoutOnWatch } from './OutdoorGlanceNativeModule';

export default function WatchCyclingButton() {
  const { t } = useTranslation();
  const [starting, setStarting] = useState(false);
  const [requested, setRequested] = useState(false);
  const inFlight = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  if (Platform.OS !== 'ios' || Platform.isPad) return null;

  const startCycling = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setStarting(true);
    setRequested(false);
    try {
      const launched = await startOutdoorCyclingWorkoutOnWatch();
      if (!mounted.current) return;
      if (launched) {
        setRequested(true);
      } else {
        Alert.alert(t('watch_cycling_start'), t('watch_cycling_failed'));
      }
    } catch {
      if (mounted.current) {
        Alert.alert(t('watch_cycling_start'), t('watch_cycling_failed'));
      }
    } finally {
      inFlight.current = false;
      if (mounted.current) setStarting(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityState={{ disabled: starting, busy: starting }}
        disabled={starting}
        onPress={startCycling}
        style={[styles.button, starting && styles.busy]}
      >
        {starting && <ActivityIndicator size="small" color="#4ECDC4" />}
        <Text style={styles.label}>
          {t(starting ? 'watch_cycling_starting' : 'watch_cycling_start')}
        </Text>
      </TouchableOpacity>
      {requested && <Text accessibilityLiveRegion="polite" style={styles.status}>{t('watch_cycling_requested')}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  button: { minHeight: 48, borderRadius: 8, borderWidth: 1, borderColor: '#4ECDC4', padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  busy: { opacity: 0.65 },
  label: { color: '#4ECDC4', fontSize: 14, fontWeight: '600', flexShrink: 1, textAlign: 'center' },
  status: { color: '#AAAAAA', fontSize: 13, lineHeight: 18, marginTop: 8 },
});
