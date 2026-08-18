import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Text, View, TouchableOpacity, Modal, ScrollView, Dimensions, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import MapView, { Marker, Polyline } from 'react-native-maps';

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

/**
 * Photo footprints for one trip, grouped by day and ordered within the day.
 *
 * Only photos whose EXIF carried GPS appear. Photos taken with location off —
 * and every photo saved by builds before coordinates were kept — simply have
 * none, so the footprint is drawn from what is actually known rather than
 * interpolated between city pins.
 */
function buildFootprint(trip) {
  const days = [];

  for (const day of trip?.days || []) {
    const fromPhotos = (day.photos || [])
      .map(photo => {
        const coords = normalizeCoords(photo?.coords);
        return coords ? { coords, takenAt: photo.takenAt, uri: photo.uri } : null;
      })
      .filter(Boolean);

    // Recorded stops, for the stretches of a day nobody photographed. They
    // carry no picture, so they draw as a dot rather than a thumbnail.
    const fromVisits = (day.visits || [])
      .map(visit => {
        const coords = normalizeCoords(visit?.coords);
        return coords
          ? { coords, takenAt: new Date(visit.arrivalAt || 0).toISOString(), uri: null }
          : null;
      })
      .filter(Boolean);

    const points = [...fromPhotos, ...fromVisits]
      .sort((a, b) => String(a.takenAt || '').localeCompare(String(b.takenAt || '')));

    if (points.length > 0) {
      days.push({ date: day.date, points });
    }
  }

  return days;
}

const DAY_ROUTE_COLORS = ['#D4AF37', '#4ECDC4', '#FF8C69', '#9B8EC4', '#6BCB77', '#64B5F6'];

/**
 * The trip's own first photo, for use as its pin and chip.
 *
 * A map of identical camera glyphs tells the reader nothing about where they
 * have been; the photograph does. Falls back to the emoji for trips entered by
 * hand, which genuinely have no picture yet.
 */
function firstPhotoUri(trip) {
  for (const day of trip?.days || []) {
    for (const photo of day?.photos || []) {
      if (photo?.uri) return photo.uri;
    }
  }

  return null;
}

export default function MapScreen({ trips }) {
  const { t } = useTranslation();
  const [selectedTrip, setSelectedTrip] = useState(null);
  const mapRef = useRef(null);
  const [mapType, setMapType] = useState('standard');
  const [showFootprint, setShowFootprint] = useState(true);
  const [viewerPhoto, setViewerPhoto] = useState(null);
  // react-native-maps snapshots a marker's view once tracksViewChanges goes
  // false. Turning it off before the image decodes leaves a blank pin, so each
  // marker keeps redrawing until its own photo reports loaded.
  const [readyUris, setReadyUris] = useState(() => new Set());
  const markPhotoReady = uri =>
    setReadyUris(prev => (prev.has(uri) ? prev : new Set(prev).add(uri)));

  // 获取所有有坐标的旅程
  const safeTrips = Array.isArray(trips) ? trips : [];
  const mappedTrips = safeTrips
    .map(t => {
      const coords = normalizeCoords(t.coords) || getCoords(t.city);
      return coords ? { ...t, coords } : null;
    })
    .filter(Boolean);
  const unmappedTrips = safeTrips.filter(t => !getCoords(t.city));

  const footprint = selectedTrip ? buildFootprint(selectedTrip) : [];
  const footprintPointCount = footprint.reduce((n, d) => n + d.points.length, 0);

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
        <View style={{gap:8,alignItems:'flex-end'}}>
          <TouchableOpacity
            style={s.mapTypeBtn}
            onPress={() => setMapType(mapType === 'standard' ? 'satellite' : 'standard')}>
            <Text style={s.mapTypeBtnText}>{mapType === 'standard' ? `🛰 ${t('map_satellite')}` : `🗺 ${t('map_standard')}`}</Text>
          </TouchableOpacity>
          {/* Only offer the toggle when this trip actually has located photos. */}
          {footprintPointCount > 0 && (
            <TouchableOpacity
              style={[s.mapTypeBtn, showFootprint && s.mapTypeBtnActive]}
              onPress={() => setShowFootprint(!showFootprint)}>
              <Text style={[s.mapTypeBtnText, showFootprint && {color:'#D4AF37'}]}>
                {`👣 ${t('map_footprint')} ${footprintPointCount}`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
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
            {mappedTrips.map(trip => {
              const cover = firstPhotoUri(trip);

              return (
                <Marker
                  key={trip.id}
                  coordinate={{ latitude: trip.coords.lat, longitude: trip.coords.lng }}
                  tracksViewChanges={!cover || !readyUris.has(cover)}
                  onPress={() => setSelectedTrip(trip)}>
                  <View style={s.markerContainer}>
                    <View style={[s.marker, selectedTrip?.id === trip.id && s.markerSelected]}>
                      {cover ? (
                        <Image
                          source={{ uri: cover }}
                          style={s.markerPhoto}
                          onLoad={() => markPhotoReady(cover)}
                          onError={() => markPhotoReady(cover)}
                        />
                      ) : (
                        <Text style={s.markerEmoji}>{trip.emoji}</Text>
                      )}
                    </View>
                    <View style={s.markerTail}/>
                  </View>
                </Marker>
              );
            })}

            {/* 选中旅程的照片足迹 */}
            {showFootprint && footprint.map((day, dayIndex) => (
              <React.Fragment key={`fp_${day.date}`}>
                {day.points.length > 1 && (
                  <Polyline
                    coordinates={day.points.map(p => ({
                      latitude: p.coords.lat,
                      longitude: p.coords.lng,
                    }))}
                    strokeColor={DAY_ROUTE_COLORS[dayIndex % DAY_ROUTE_COLORS.length]}
                    strokeWidth={3}
                  />
                )}
                {day.points.map((point, i) => {
                  const colour = DAY_ROUTE_COLORS[dayIndex % DAY_ROUTE_COLORS.length];

                  return (
                    <Marker
                      key={`fp_${day.date}_${i}`}
                      coordinate={{ latitude: point.coords.lat, longitude: point.coords.lng }}
                      anchor={{ x: 0.5, y: 0.5 }}
                      tracksViewChanges={!!point.uri && !readyUris.has(point.uri)}
                      onPress={() =>
                        point.uri &&
                        setViewerPhoto({ uri: point.uri, date: day.date, takenAt: point.takenAt })
                      }>
                      {point.uri ? (
                        <Image
                          source={{ uri: point.uri }}
                          style={[s.footPhoto, { borderColor: colour }]}
                          onLoad={() => markPhotoReady(point.uri)}
                          onError={() => markPhotoReady(point.uri)}
                        />
                      ) : (
                        <View style={[s.footDot, { borderColor: colour }]}/>
                      )}
                    </Marker>
                  );
                })}
              </React.Fragment>
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
                {firstPhotoUri(trip) ? (
                  <Image source={{ uri: firstPhotoUri(trip) }} style={s.tripChipPhoto}/>
                ) : (
                  <Text style={s.tripChipEmoji}>{trip.emoji}</Text>
                )}
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
                {firstPhotoUri(selectedTrip) ? (
                  <Image source={{ uri: firstPhotoUri(selectedTrip) }} style={s.modalPhoto}/>
                ) : (
                  <Text style={s.modalEmoji}>{selectedTrip.emoji}</Text>
                )}
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

      {/* A footprint pin is a photograph, so tapping one should show it. */}
      <Modal visible={!!viewerPhoto} transparent animationType="fade">
        <View style={s.photoViewerOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setViewerPhoto(null)}
          />
          {viewerPhoto && (
            <>
              <Image
                source={{ uri: viewerPhoto.uri }}
                style={s.photoViewerImage}
                resizeMode="contain"
                pointerEvents="none"
              />
              <Text style={s.photoViewerMeta}>{viewerPhoto.date}</Text>
            </>
          )}
          <TouchableOpacity
            style={s.photoViewerClose}
            onPress={() => setViewerPhoto(null)}>
            <Text style={s.photoViewerCloseText}>✕</Text>
          </TouchableOpacity>
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
  mapTypeBtnActive: {borderColor:'#D4AF3780', backgroundColor:'#D4AF3715'},
  footDot: {width:11, height:11, borderRadius:6, borderWidth:2.5, backgroundColor:'#0D0D0D'},
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
  markerPhoto: {width:34, height:34, borderRadius:17},
  footPhoto: {width:34, height:34, borderRadius:7, borderWidth:2},
  photoViewerOverlay: {flex:1, backgroundColor:'#000000EE', justifyContent:'center'},
  photoViewerImage: {width:'100%', height:height*0.7},
  photoViewerMeta: {color:'#888', fontSize:13, textAlign:'center', marginTop:16},
  photoViewerClose: {position:'absolute', top:60, right:24, padding:10},
  photoViewerCloseText: {color:'#F0EDE8', fontSize:28, fontWeight:'300'},
  markerTail: {width:2, height:8, backgroundColor:'#D4AF37', opacity:0.6},
  tripList: {paddingVertical:14, backgroundColor:'#0D0D0D', borderTopWidth:1, borderTopColor:'#1A1A1A'},
  tripChip: {backgroundColor:'#161616', borderRadius:14, padding:12, alignItems:'center', width:80, borderWidth:1, borderColor:'#242424'},
  tripChipActive: {borderColor:'#D4AF37', backgroundColor:'#D4AF3710'},
  tripChipEmoji: {fontSize:22, marginBottom:4},
  tripChipPhoto: {width:34, height:34, borderRadius:8, marginBottom:4},
  tripChipCity: {fontSize:11, color:'#888', textAlign:'center'},
  tripChipMeta: {fontSize:10, color:'#555', marginTop:2},
  modalOverlay: {flex:1, justifyContent:'flex-end', backgroundColor:'#00000088'},
  modalSheet: {backgroundColor:'#111', borderTopLeftRadius:24, borderTopRightRadius:24, padding:24, paddingBottom:40, borderTopWidth:1, borderColor:'#2A2A2A'},
  modalHeader: {flexDirection:'row', alignItems:'center', gap:14, marginBottom:20},
  modalEmoji: {fontSize:40},
  modalPhoto: {width:52, height:52, borderRadius:12},
  modalCity: {fontSize:22, color:'#F0EDE8', fontWeight:'300'},
  modalMeta: {fontSize:13, color:'#555', marginTop:4},
  modalStats: {flexDirection:'row', gap:12},
  modalStat: {flex:1, backgroundColor:'#1A1A1A', borderRadius:12, padding:14, alignItems:'center'},
  modalStatNum: {fontSize:24, color:'#D4AF37', fontWeight:'300'},
  modalStatLabel: {fontSize:11, color:'#555', marginTop:4},
});
