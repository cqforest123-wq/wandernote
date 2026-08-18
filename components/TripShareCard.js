import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

// Rendered at point size and captured at 3x, same as ShareCard.
export const TRIP_CARD_WIDTH = 340;

function Stat({ value, label }) {
  return (
    <View style={s.stat}>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

/**
 * A shareable summary of one trip: where, when, and what it amounted to.
 *
 * The app had no way to show anyone a trip, which is a problem for a travel
 * journal — the thing people most want to do with a trip is show it to
 * somebody. Rendered off-screen purely as input to view-shot.
 */
export default function TripShareCard({ cardRef, stats, emoji, labels }) {
  const [broken, setBroken] = React.useState({});
  const photos = (stats?.coverPhotos || []).filter(uri => !broken[uri]);

  // Two or three photos in a four-slot grid leaves a hole, so only ever lay
  // out a count the grid can fill: one across the top, or four in a square.
  const grid = photos.length >= 4 ? photos.slice(0, 4) : photos.slice(0, 1);

  return (
    <View ref={cardRef} collapsable={false} style={s.card}>
      <View style={s.header}>
        <Text style={s.emoji}>{emoji || '🌍'}</Text>
        <View style={{ flex: 1 }}>
          <Text style={s.title} numberOfLines={2}>
            {stats?.title || labels?.untitled || ''}
          </Text>
          {stats?.dateRange ? (
            <Text style={s.dates} numberOfLines={1}>{stats.dateRange}</Text>
          ) : null}
        </View>
      </View>

      {grid.length > 0 ? (
        <View style={[s.grid, grid.length === 1 && s.gridSingle]}>
          {grid.map(uri => (
            <Image
              key={uri}
              source={{ uri }}
              style={grid.length === 1 ? s.photoWide : s.photoTile}
              resizeMode="cover"
              onError={() => setBroken(prev => ({ ...prev, [uri]: true }))}
            />
          ))}
        </View>
      ) : null}

      <View style={s.stats}>
        <Stat value={String(stats?.days ?? 0)} label={labels?.days} />
        <Stat value={String(stats?.photos ?? 0)} label={labels?.photos} />
        {stats?.distance ? <Stat value={stats.distance} label={labels?.distance} /> : null}
        {stats?.spend ? <Stat value={stats.spend} label={labels?.spend} /> : null}
      </View>

      <View style={s.footer}>
        <View style={s.rule} />
        <Text style={s.brand}>WanderNote</Text>
      </View>
    </View>
  );
}

const GAP = 6;
const TILE = (TRIP_CARD_WIDTH - 48 - GAP) / 2;

const s = StyleSheet.create({
  card: {
    width: TRIP_CARD_WIDTH,
    backgroundColor: '#0D0D0D',
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  emoji: { fontSize: 34 },
  title: { fontSize: 21, color: '#F0EDE8', fontWeight: '600', letterSpacing: 0.3 },
  dates: { fontSize: 12, color: '#7A7A7A', marginTop: 4, letterSpacing: 1 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP, marginBottom: 18 },
  gridSingle: { marginBottom: 18 },
  photoTile: { width: TILE, height: TILE, borderRadius: 10, backgroundColor: '#161616' },
  photoWide: { width: '100%', height: 170, borderRadius: 12, backgroundColor: '#161616' },

  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stat: {
    flexGrow: 1,
    minWidth: 66,
    backgroundColor: '#161616',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  statValue: { fontSize: 17, color: '#D4AF37', fontWeight: '500' },
  statLabel: { fontSize: 10, color: '#666', marginTop: 4, letterSpacing: 0.5 },

  footer: { marginTop: 22, alignItems: 'center' },
  rule: { width: 36, height: 1, backgroundColor: '#D4AF3760', marginBottom: 10 },
  brand: { fontSize: 11, color: '#D4AF37', letterSpacing: 3 },
});
