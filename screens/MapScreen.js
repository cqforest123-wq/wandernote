import React, { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Text, View, TouchableOpacity, Modal, ScrollView, Dimensions } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

const { width, height } = Dimensions.get('window');

// 城市坐标数据库
const CITY_COORDS = {
  // 日本
  '东京': { lat: 35.6762, lng: 139.6503 },
  '京都': { lat: 35.0116, lng: 135.7681 },
  '大阪': { lat: 34.6937, lng: 135.5023 },
  '奈良': { lat: 34.6851, lng: 135.8048 },
  '北海道': { lat: 43.0642, lng: 141.3469 },
  '冲绳': { lat: 26.2124, lng: 127.6809 },
  // 冰岛
  '雷克雅未克': { lat: 64.1466, lng: -21.9426 },
  '黄金圈': { lat: 64.3271, lng: -20.1199 },
  '蓝湖': { lat: 63.8803, lng: -22.4489 },
  '南岸': { lat: 63.5310, lng: -19.5151 },
  // 美国
  '费尔班克斯': { lat: 64.8378, lng: -147.7164 },
  '夏威夷': { lat: 21.3069, lng: -157.8583 },
  '纽约': { lat: 40.7128, lng: -74.0060 },
  '洛杉矶': { lat: 34.0522, lng: -118.2437 },
  '旧金山': { lat: 37.7749, lng: -122.4194 },
  '拉斯维加斯': { lat: 36.1699, lng: -115.1398 },
  // 法国
  '巴黎': { lat: 48.8566, lng: 2.3522 },
  // 英国
  '伦敦': { lat: 51.5074, lng: -0.1278 },
  // 中国
  '重庆': { lat: 29.5630, lng: 106.5516 },
  '北京': { lat: 39.9042, lng: 116.4074 },
  '上海': { lat: 31.2304, lng: 121.4737 },
  '成都': { lat: 30.5728, lng: 104.0668 },
  // 泰国
  '曼谷': { lat: 13.7563, lng: 100.5018 },
  '清迈': { lat: 18.7883, lng: 98.9853 },
  // 意大利
  '罗马': { lat: 41.9028, lng: 12.4964 },
  '威尼斯': { lat: 45.4408, lng: 12.3155 },
  // 西班牙
  '巴塞罗那': { lat: 41.3851, lng: 2.1734 },
  // 澳大利亚
  '悉尼': { lat: -33.8688, lng: 151.2093 },
  '墨尔本': { lat: -37.8136, lng: 144.9631 },
  // 新加坡
  '新加坡': { lat: 1.3521, lng: 103.8198 },
  // 韩国
  '首尔': { lat: 37.5665, lng: 126.9780 },
  // 越南
  '河内': { lat: 21.0285, lng: 105.8542 },
  '胡志明市': { lat: 10.8231, lng: 106.6297 },
  // 印度
  '泰姬陵/阿格拉': { lat: 27.1751, lng: 78.0421 },
  // 巴西
  '里约热内卢': { lat: -22.9068, lng: -43.1729 },
  // 阿联酋
  '迪拜': { lat: 25.2048, lng: 55.2708 },
  // 土耳其
  '伊斯坦布尔': { lat: 41.0082, lng: 28.9784 },
  // 摩洛哥
  '马拉喀什': { lat: 31.6295, lng: -7.9811 },
  // 秘鲁
  '马丘比丘': { lat: -13.1631, lng: -72.5450 },
};

function getCoords(cityName) {
  // 精确匹配
  if (CITY_COORDS[cityName]) return CITY_COORDS[cityName];
  // 模糊匹配
  const key = Object.keys(CITY_COORDS).find(k => 
    cityName.includes(k) || k.includes(cityName)
  );
  return key ? CITY_COORDS[key] : null;
}

export default function MapScreen({ trips }) {
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [mapType, setMapType] = useState('standard');

  // 获取所有有坐标的旅程
  const mappedTrips = trips.map(t => ({
    ...t,
    coords: getCoords(t.city),
  })).filter(t => t.coords);

  const unmappedTrips = trips.filter(t => !getCoords(t.city));

  // 计算地图中心
  const getInitialRegion = () => {
    if (mappedTrips.length === 0) {
      return { latitude: 25, longitude: 15, latitudeDelta: 120, longitudeDelta: 120 };
    }
    const lats = mappedTrips.map(t => t.coords.lat);
    const lngs = mappedTrips.map(t => t.coords.lng);
    const midLat = (Math.max(...lats) + Math.min(...lats)) / 2;
    const midLng = (Math.max(...lngs) + Math.min(...lngs)) / 2;
    const deltaLat = Math.max(Math.max(...lats) - Math.min(...lats), 20) * 1.5;
    const deltaLng = Math.max(Math.max(...lngs) - Math.min(...lngs), 20) * 1.5;
    return { latitude: midLat, longitude: midLng, latitudeDelta: deltaLat, longitudeDelta: deltaLng };
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" />

      {/* 顶部统计 */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>🗺 旅行足迹</Text>
          <Text style={s.subtitle}>足迹遍布 {mappedTrips.length} 个地方</Text>
        </View>
        <TouchableOpacity
          style={s.mapTypeBtn}
          onPress={() => setMapType(mapType === 'standard' ? 'satellite' : 'standard')}>
          <Text style={s.mapTypeBtnText}>{mapType === 'standard' ? '🛰 卫星' : '🗺 地图'}</Text>
        </TouchableOpacity>
      </View>

      {/* 地图 */}
      <View style={s.mapContainer}>
        {mappedTrips.length === 0 ? (
          <View style={s.emptyMap}>
            <Text style={s.emptyEmoji}>🌍</Text>
            <Text style={s.emptyText}>还没有可显示的旅程</Text>
            <Text style={s.emptyHint}>添加旅程后这里会显示你的足迹</Text>
          </View>
        ) : (
          <MapView
            style={s.map}
            mapType={mapType}
            initialRegion={getInitialRegion()}
            showsUserLocation={true}
            showsCompass={false}>
            {mappedTrips.map(trip => (
              <Marker
                key={trip.id}
                coordinate={{ latitude: trip.coords.lat, longitude: trip.coords.lng }}
                onPress={() => setSelectedTrip(trip)}
                title={trip.city}
                description={trip.country}>
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
                onPress={() => setSelectedTrip(selectedTrip?.id === trip.id ? null : trip)}>
                <Text style={s.tripChipEmoji}>{trip.emoji}</Text>
                <Text style={[s.tripChipCity, selectedTrip?.id === trip.id && {color:'#D4AF37'}]}>
                  {trip.city}
                </Text>
                <Text style={s.tripChipMeta}>{trip.days.length}天</Text>
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
                  [String(selectedTrip.days.length), '天'],
                  [String(selectedTrip.days.reduce((a,d)=>a+d.memos.length,0)), '感言'],
                  [String(selectedTrip.days.reduce((a,d)=>a+(d.photos||[]).length,0)), '照片'],
                ].map(([n,l]) => (
                  <View key={l} style={s.modalStat}>
                    <Text style={s.modalStatNum}>{n}</Text>
                    <Text style={s.modalStatLabel}>{l}</Text>
                  </View>
                ))}
              </View>
              {selectedTrip.plannedDate && (
                <Text style={{color:'#4ECDC4', fontSize:13, textAlign:'center', marginTop:8}}>
                  ✈️ 出发日期：{selectedTrip.plannedDate}
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
