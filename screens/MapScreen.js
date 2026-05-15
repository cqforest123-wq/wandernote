import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Text, View, TouchableOpacity, Modal, ScrollView, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import MapView, { Marker } from 'react-native-maps';

const { width, height } = Dimensions.get('window');

// 城市坐标数据库
import { CITY_COORDS } from '../lib/cityCoords';

function normalizeCoords(coords) {
  if (!coords) return null;
  const lat = Number(coords.lat);
  const lng = Number(coords.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90) return null;
  if (lng < -180 || lng > 180) return null;
  return { lat, lng };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getCoords(cityName) {
  const name = String(cityName || '').trim();
  if (!name) return null;
  const exact = normalizeCoords(CITY_COORDS[name]);
  if (exact) return exact;
  const key = Object.keys(CITY_COORDS).find(k =>
    name.includes(k) || k.includes(name)
  );
  return key ? normalizeCoords(CITY_COORDS[key]) : null;
}

export default function MapScreen({ trips }) {
  const { t } = useTranslation();
  const [selectedTrip, setSelectedTrip] = useState(null);
  const mapRef = useRef(null);
  const [mapType, setMapType] = useState('standard');

  // 获取所有有坐标的旅程
  const safeTrips = Array.isArray(trips) ? trips : [];
  const mappedTrips = safeTrips
    .map(t => {
      const coords = normalizeCoords(t.coords) || getCoords(t.city);
      return coords ? { ...t, coords } : null;
    })
    .filter(Boolean);
  const unmappedTrips = safeTrips.filter(t => !getCoords(t.city));

  // 计算地图中心
  const getInitialRegion = () => {
    if (mappedTrips.length === 0) {
      return { latitude: 25, longitude: 15, latitudeDelta: 80, longitudeDelta: 160 };
    }
    const lats = mappedTrips.map(t => t.coords.lat);
    const lngs = mappedTrips.map(t => t.coords.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const midLat = (maxLat + minLat) / 2;
    const midLng = (maxLng + minLng) / 2;
    const deltaLat = clamp((maxLat - minLat) * 1.5, 4, 80);
    const deltaLng = clamp((maxLng - minLng) * 1.5, 4, 160);
    return {
      latitude: Number.isFinite(midLat) ? midLat : 25,
      longitude: Number.isFinite(midLng) ? midLng : 15,
      latitudeDelta: deltaLat,
      longitudeDelta: deltaLng,
    };
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" />

      {/* 顶部统计 */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>🗺 {t('map_title')}</Text>
          <Text style={s.subtitle}>{t('map_subtitle').replace('%d', mappedTrips.length)}</Text>
        </View>
        <TouchableOpacity
          style={s.mapTypeBtn}
          onPress={() => setMapType(mapType === 'standard' ? 'satellite' : 'standard')}>
          <Text style={s.mapTypeBtnText}>{mapType === 'standard' ? `🛰 ${t('map_satellite')}` : `🗺 ${t('map_standard')}`}</Text>
        </TouchableOpacity>
      </View>

      {/* 地图 */}
      <View style={s.mapContainer}>
        {mappedTrips.length === 0 ? (
          <View style={s.emptyMap}>
            <Text style={s.emptyEmoji}>🌍</Text>
            <Text style={s.emptyText}>{t('map_empty_title')}</Text>
            <Text style={s.emptyHint}>{t('map_empty_hint')}</Text>
          </View>
        ) : (
          <MapView
            ref={mapRef}
            style={s.map}
            mapType={mapType}
            initialRegion={getInitialRegion()}
            showsUserLocation={false}
            showsCompass={false}>
            {mappedTrips.map(trip => (
              <Marker
                key={trip.id}
                coordinate={{ latitude: trip.coords.lat, longitude: trip.coords.lng }}
                onPress={() => setSelectedTrip(trip)}>
                <View style={s.markerContainer}>
                  <View style={[s.marker, selectedTrip?.id === trip.id && s.markerSelected]}>
                    <Text style={s.markerEmoji}>{trip.emoji}</Text>
                  </View>
                  <View style={s.markerTail}/>
                </View>
              </Marker>
            ))}
          </MapView>
        )}
      </View>

      {/* 底部旅程列表 */}
      <View style={s.tripList}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{flexDirection:'row', gap:10, paddingHorizontal:16}}>
            {mappedTrips.map(trip => (
              <TouchableOpacity
                key={trip.id}
                style={[s.tripChip, selectedTrip?.id === trip.id && s.tripChipActive]}
                onPress={() => {
                  setSelectedTrip(selectedTrip?.id === trip.id ? null : trip);
                  if (trip.coords) {
                    mapRef.current?.animateToRegion({
                      latitude: trip.coords.lat,
                      longitude: trip.coords.lng,
                      latitudeDelta: 8,
                      longitudeDelta: 8,
                    }, 800);
                  }
                }}>
                <Text style={s.tripChipEmoji}>{trip.emoji}</Text>
                <Text style={[s.tripChipCity, selectedTrip?.id === trip.id && {color:'#D4AF37'}]}>
                  {trip.city}
                </Text>
                <Text style={s.tripChipMeta}>{trip.days?.length || 0} {t('unit_days')}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* 选中旅程详情弹窗 */}
      <Modal visible={!!selectedTrip} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <TouchableOpacity style={{flex:1}} onPress={() => setSelectedTrip(null)}/>
          {selectedTrip && (
            <View style={s.modalSheet}>
              <View style={s.modalHeader}>
                <Text style={s.modalEmoji}>{selectedTrip.emoji}</Text>
                <View style={{flex:1}}>
                  <Text style={s.modalCity}>{selectedTrip.city}</Text>
                  <Text style={s.modalMeta}>{selectedTrip.country} · {selectedTrip.date}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedTrip(null)}>
                  <Text style={{color:'#555', fontSize:18}}>✕</Text>
                </TouchableOpacity>
              </View>
              <View style={s.modalStats}>
                {[
                  [String(selectedTrip.days?.length || 0), t('unit_days')],
                  [String((selectedTrip.days||[]).reduce((a,d)=>a+(d.memos||[]).length,0)), t('stat_memos')],
                  [String((selectedTrip.days||[]).reduce((a,d)=>a+(d.photos||[]).length,0)), t('stat_photos')],
                ].map(([n,l]) => (
                  <View key={l} style={s.modalStat}>
                    <Text style={s.modalStatNum}>{n}</Text>
                    <Text style={s.modalStatLabel}>{l}</Text>
                  </View>
                ))}
              </View>
              {selectedTrip.plannedDate && (
                <Text style={{color:'#4ECDC4', fontSize:13, textAlign:'center', marginTop:8}}>
                  ✈️ {t('map_departure_date')}: {selectedTrip.plannedDate}
                </Text>
              )}
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {flex:1, backgroundColor:'#0D0D0D'},
  header: {flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:20, paddingBottom:12},
  title: {fontSize:22, color:'#F0EDE8', fontWeight:'300'},
  subtitle: {fontSize:13, color:'#555', marginTop:3},
  mapTypeBtn: {backgroundColor:'#1A1A1A', borderRadius:20, paddingHorizontal:14, paddingVertical:8, borderWidth:1, borderColor:'#2A2A2A'},
  mapTypeBtnText: {color:'#888', fontSize:13},
  mapContainer: {flex:1},
  map: {flex:1},
  emptyMap: {flex:1, alignItems:'center', justifyContent:'center'},
  emptyEmoji: {fontSize:64, marginBottom:16},
  emptyText: {fontSize:16, color:'#555'},
  emptyHint: {fontSize:13, color:'#333', marginTop:8},
  markerContainer: {alignItems:'center'},
  marker: {backgroundColor:'#1A1A1A', borderRadius:22, padding:6, borderWidth:2, borderColor:'#D4AF3760', shadowColor:'#000', shadowOpacity:0.3, shadowRadius:4},
  markerSelected: {borderColor:'#D4AF37', backgroundColor:'#D4AF3720'},
  markerEmoji: {fontSize:22},
  markerTail: {width:2, height:8, backgroundColor:'#D4AF37', opacity:0.6},
  tripList: {paddingVertical:14, backgroundColor:'#0D0D0D', borderTopWidth:1, borderTopColor:'#1A1A1A'},
  tripChip: {backgroundColor:'#161616', borderRadius:14, padding:12, alignItems:'center', width:80, borderWidth:1, borderColor:'#242424'},
  tripChipActive: {borderColor:'#D4AF37', backgroundColor:'#D4AF3710'},
  tripChipEmoji: {fontSize:22, marginBottom:4},
  tripChipCity: {fontSize:11, color:'#888', textAlign:'center'},
  tripChipMeta: {fontSize:10, color:'#555', marginTop:2},
  modalOverlay: {flex:1, justifyContent:'flex-end', backgroundColor:'#00000088'},
  modalSheet: {backgroundColor:'#111', borderTopLeftRadius:24, borderTopRightRadius:24, padding:24, paddingBottom:40, borderTopWidth:1, borderColor:'#2A2A2A'},
  modalHeader: {flexDirection:'row', alignItems:'center', gap:14, marginBottom:20},
  modalEmoji: {fontSize:40},
  modalCity: {fontSize:22, color:'#F0EDE8', fontWeight:'300'},
  modalMeta: {fontSize:13, color:'#555', marginTop:4},
  modalStats: {flexDirection:'row', gap:12},
  modalStat: {flex:1, backgroundColor:'#1A1A1A', borderRadius:12, padding:14, alignItems:'center'},
  modalStatNum: {fontSize:24, color:'#D4AF37', fontWeight:'300'},
  modalStatLabel: {fontSize:11, color:'#555', marginTop:4},
});
