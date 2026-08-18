import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { searchAll } from '../lib/search';
import { STORAGE_KEYS } from '../lib/storageKeys';

const TYPE_ICONS = {
  trip: '🗺',
  memo: '✍️',
  expense: '💰',
  checklist: '📋',
};

/**
 * Search across everything the user has written, not just trip titles.
 *
 * The home screen's field filters the trip list, which cannot find a note
 * written on day four of a trip whose name you have forgotten — the case where
 * search is actually worth having.
 */
export default function SearchScreen({ navigation, trips }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [memos, setMemos] = useState(null);

  useEffect(() => {
    let cancelled = false;

    AsyncStorage.getItem(STORAGE_KEYS.memos)
      .then(raw => {
        if (cancelled) return;
        try {
          const parsed = JSON.parse(raw || '[]');
          setMemos(Array.isArray(parsed) ? parsed : []);
        } catch (e) {
          setMemos([]);
        }
      })
      .catch(() => !cancelled && setMemos([]));

    return () => {
      cancelled = true;
    };
  }, []);

  const results = useMemo(
    () => (memos === null ? [] : searchAll({ trips, memos, query })),
    [trips, memos, query]
  );

  const grouped = useMemo(() => {
    const byType = { trip: [], memo: [], expense: [], checklist: [] };

    for (const result of results) {
      (byType[result.type] || byType.trip).push(result);
    }

    return byType;
  }, [results]);

  const openResult = result => {
    const trip = (trips || []).find(item => String(item?.id) === String(result.tripId));

    if (result.type === 'checklist' || !trip) {
      return;
    }

    if (result.dayDate) {
      const dayIndex = (trip.days || []).findIndex(day => day?.date === result.dayDate);

      if (dayIndex >= 0) {
        navigation.navigate('DayDetail', { tripId: trip.id, dayIndex });
        return;
      }
    }

    navigation.navigate('TripDetail', { tripId: trip.id });
  };

  const hasQuery = query.trim().length > 0;

  const renderSection = (type, label) => {
    const rows = grouped[type];

    if (!rows.length) return null;

    return (
      <View key={type} style={s.section}>
        <Text style={s.sectionTitle}>
          {TYPE_ICONS[type]} {label} · {rows.length}
        </Text>
        {rows.map((result, index) => (
          <TouchableOpacity
            key={`${type}_${index}`}
            style={s.row}
            activeOpacity={result.type === 'checklist' ? 1 : 0.6}
            onPress={() => openResult(result)}>
            <Text style={s.rowTitle} numberOfLines={2}>
              {result.title || t('search_untitled')}
            </Text>
            {!!result.subtitle && (
              <Text style={s.rowSubtitle} numberOfLines={1}>
                {result.subtitle}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" />

      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>‹</Text>
        </TouchableOpacity>
        <TextInput
          style={s.input}
          value={query}
          onChangeText={setQuery}
          placeholder={t('search_placeholder')}
          placeholderTextColor="#555"
          autoFocus
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {memos === null ? (
        <View style={s.centered}>
          <ActivityIndicator color="#D4AF37" />
        </View>
      ) : !hasQuery ? (
        <View style={s.centered}>
          <Text style={s.hint}>{t('search_hint')}</Text>
        </View>
      ) : results.length === 0 ? (
        <View style={s.centered}>
          <Text style={s.hint}>{t('search_no_results')}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          {renderSection('trip', t('search_type_trip'))}
          {renderSection('memo', t('search_type_memo'))}
          {renderSection('expense', t('search_type_expense'))}
          {renderSection('checklist', t('search_type_checklist'))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 10 },
  backBtn: { paddingHorizontal: 10, paddingVertical: 4 },
  backText: { color: '#D4AF37', fontSize: 32, lineHeight: 34, fontWeight: '300' },
  input: {
    flex: 1,
    backgroundColor: '#161616',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#242424',
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#F0EDE8',
    fontSize: 15,
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  hint: { color: '#555', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  section: { paddingHorizontal: 16, paddingTop: 18 },
  sectionTitle: { color: '#D4AF37', fontSize: 13, marginBottom: 10 },
  row: { backgroundColor: '#161616', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#242424' },
  rowTitle: { color: '#F0EDE8', fontSize: 15, lineHeight: 21 },
  rowSubtitle: { color: '#666', fontSize: 12, marginTop: 6 },
});
