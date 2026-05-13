import React, { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { getCityCoords, haversineDistanceKm, formatDistance } from '../lib/cityCoords';
import { fetchCurrentWeather, formatTemp, getClothingAdvice } from '../lib/weather';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, Modal, KeyboardAvoidingView, Platform, Alert, Image, Share } from 'react-native';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { deleteTripAndRelated } from '../lib/sync';
import DateTimePicker from '@react-native-community/datetimepicker';

const WEEKDAYS = ['周日','周一','周二','周三','周四','周五','周六'];

export default function TripDetailScreen({ route, navigation, trips, setTrips }) {
  const { t } = useTranslation();
  const { tripId } = route.params;
  const trip = trips.find(t => t.id === tripId);

  const [showAddDay, setShowAddDay] = useState(false);
  const [dayNote, setDayNote] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());

  // 编辑旅程名
  const [showEditTrip, setShowEditTrip] = useState(false);
  const [editCity, setEditCity] = useState('');
  const [editEmoji, setEditEmoji] = useState('');
  const [showEditDate, setShowEditDate] = useState(false);
  const [editDateObj, setEditDateObj] = useState(new Date(Date.now() + 7*24*60*60*1000));
  const [distance, setDistance] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [weather, setWeather] = useState(null);
  const [useFahrenheit, setUseFahrenheit] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
        const userCoords = { lat: loc.coords.latitude, lng: loc.coords.longitude };
        const dest = trip?.coords || getCityCoords(trip?.city);
        if (!dest) return;
        const km = haversineDistanceKm(userCoords, dest);
        setDistance(formatDistance(km));
      } catch (e) {}
    })();
  }, [trip?.coords, trip?.city]);

  useEffect(() => {
    const dest = trip?.coords || getCityCoords(trip?.city);
    if (!dest) return;
    fetchCurrentWeather(dest.lat, dest.lng).then(w => {
      if (w) setWeather(w);
    });
  }, [trip?.coords, trip?.city]);

  if (!trip) return null;

  const today = new Date();
  today.setHours(23,59,59,999);

  const dateStr = `${selectedDate.getFullYear()}.${String(selectedDate.getMonth()+1).padStart(2,'0')}.${String(selectedDate.getDate()).padStart(2,'0')}`;
  const weekDay = WEEKDAYS[selectedDate.getDay()];
  const existsAlready = trip.days.find(d => d.date === dateStr);

  const openAddDay = () => {
    setSelectedDate(new Date());
    setDayNote('');
    setShowAddDay(true);
  };

  const addDay = () => {
    if (selectedDate > today) { Alert.alert(t('confirm'), t('alert_future_date')); return; }
    if (existsAlready) { setShowAddDay(false); navigation.navigate('DayDetail',{tripId,dayDate:dateStr}); return; }
    const pad = n=>String(n).padStart(2,'0');
    const now = new Date();
    const newDay = {
      date: dateStr, weekDay,
      memos: dayNote.trim()?[{id:Date.now(),text:dayNote.trim(),tag:'感受',time:`${pad(now.getHours())}:${pad(now.getMinutes())}`}]:[],
      photos:[], videos:[],
    };
    setTrips(trips.map(t=>t.id===tripId?{...t,days:[...t.days,newDay].sort((a,b)=>a.date.localeCompare(b.date))}:t));
    setDayNote(''); setShowAddDay(false);
    navigation.navigate('DayDetail',{tripId,dayDate:dateStr});
  };

  const saveEditTrip = () => {
    if (!editCity.trim()) return;
    setTrips(trips.map(t=>t.id===tripId?{...t,city:editCity.trim(),emoji:editEmoji||t.emoji}:t));
    setShowEditTrip(false);
  };

  const shareTrip = async () => {
    const totalMemos = trip.days.reduce((a,d)=>a+d.memos.length,0);
    const totalPhotos = trip.days.reduce((a,d)=>a+(d.photos||[]).length,0);
    const highlights = trip.days.flatMap(d=>d.memos).slice(0,3).map(m=>m.text).join(' | ');
    const lines = [
      trip.emoji + ' ' + trip.city + ' · ' + trip.country,
      '📅 ' + trip.days.length + '天旅程 · ' + trip.date,
      '📝 ' + totalMemos + '条感言 · 📸 ' + totalPhotos + '张照片',
      highlights ? '旅行亮点：' + highlights : '',
      '— 来自 WanderNote 旅行笔记',
    ].filter(Boolean);
    await Share.share({ message: lines.join('\n') });
  };

  const deleteTrip = () => {
    if (isDeleting) return; // 正在删除中，忽略重复触发
    Alert.alert(t('trip_delete'), `${t('trip_delete_confirm').replace('%s', trip.city)}`, [
      { text: t('cancel'), style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          setIsDeleting(true);
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user?.id) throw new Error('未登录');
            await deleteTripAndRelated(user.id, trip.id);
            setTrips(prev => prev.filter(t => t.id !== trip.id));
            navigation.goBack();
          } catch (e) {
            console.error('deleteTrip error:', e.message);
            Alert.alert(t('alert_delete_failed'), e.message || t('alert_network_retry'));
          } finally {
            setIsDeleting(false);
          }
        },
      },
    ]);
  };

  const deleteDay = (dayDate) => {
    Alert.alert(t('alert_delete_day'), t('alert_delete_day_confirm').replace('%s', dayDate),[
      {text:t('cancel'),style:'cancel'},
      {text:'删除',style:'destructive',onPress:()=>setTrips(trips.map(t=>t.id===tripId?{...t,days:t.days.filter(d=>d.date!==dayDate)}:t))},
    ]);
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" />
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.topRow}>
          <TouchableOpacity onPress={()=>navigation.goBack()}><Text style={s.backText}>← 返回</Text></TouchableOpacity>
          <View style={{flexDirection:'row',gap:12}}>
            <TouchableOpacity onPress={shareTrip}><Text style={{color:'#4ECDC4',fontSize:13}}>分享 ↗</Text></TouchableOpacity>
            <TouchableOpacity onPress={deleteTrip}><Text style={s.deleteText}>删除旅程</Text></TouchableOpacity>
          </View>
        </View>

        {/* 旅程标题 — 点击可编辑 */}
        <TouchableOpacity style={s.tripHeader} onPress={()=>{setEditCity(trip.city);setShowEditTrip(true);}}>
          <Text style={s.tripEmoji}>{trip.emoji}</Text>
          <View style={{flex:1}}>
            <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
              <Text style={s.tripCity} numberOfLines={1} ellipsizeMode='tail'>{trip.city}</Text>
              <Text style={s.editHint}>✏️</Text>
            </View>
            <Text style={s.tripMeta}>{trip.country}</Text>
          </View>
        </TouchableOpacity>

        {trip.plannedDate ? (
          <TouchableOpacity onPress={()=>{
            const parts = trip.plannedDate.split('.');
            setEditDateObj(new Date(parseInt(parts[0]),parseInt(parts[1])-1,parseInt(parts[2])));
            setShowEditDate(true);
          }} style={{marginBottom:16,flexDirection:'row',alignItems:'center',gap:8}}>
            <Text style={{fontSize:14,color:'#F0EDE8',fontWeight:'500'}}>✈️ 出发：{trip.plannedDate}</Text>
            <Text style={{fontSize:12,color:'#4ECDC4'}}>点击修改</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={()=>setShowEditDate(true)} style={{marginBottom:16}}>
            <Text style={{fontSize:14,color:'#F0EDE8',fontWeight:'500'}}>✈️ 设置出发倒计时</Text>
          </TouchableOpacity>
        )}
        {distance && (
          <View style={s.distanceCard}>
            <Text style={s.distanceIcon}>📍</Text>
            <View>
              <Text style={s.distanceLabel}>距离目的地</Text>
              <Text style={s.distanceValue}>{distance}</Text>
            </View>
          </View>
        )}
        {weather && (
          <TouchableOpacity style={s.weatherCard} onPress={() => setUseFahrenheit(f => !f)}>
            <View style={s.weatherMain}>
              <Text style={s.weatherEmoji}>{weather.emoji}</Text>
              <View style={{flex:1}}>
                <Text style={s.weatherTemp}>{formatTemp(weather.temp, useFahrenheit)}</Text>
                <Text style={s.weatherDesc}>{weather.desc}</Text>
              </View>
              <Text style={s.weatherToggle}>{useFahrenheit ? '°F' : '°C'}</Text>
            </View>
            {getClothingAdvice(weather.temp, weather.temp - 5, weather.code).map((item, i) => (
              <View key={i} style={s.clothingRow}>
                <Text style={s.clothingIcon}>{item.icon}</Text>
                <Text style={s.clothingText}>{item.text}</Text>
              </View>
            ))}
          </TouchableOpacity>
        )}
        <View style={s.statsRow}>
          {[
            [String(trip.days.length),t('stat_days')],
            [String(trip.days.reduce((a,d)=>a+d.memos.length,0)),'感言'],
            [String(trip.days.reduce((a,d)=>a+(d.photos||[]).length,0)),'照片'],
            // [String(trip.days.reduce((a,d)=>a+(d.videos||[]).length,0)),'视频'], // v2.0
          ].map(([n,l])=>(
            <View key={l} style={s.statBox}>
              <Text style={s.statNum}>{n}</Text>
              <Text style={s.statLabel}>{l}</Text>
            </View>
          ))}
        </View>

        {/* 打包清单入口 */}
        <TouchableOpacity style={s.packingBtn}
          onPress={()=>navigation.navigate('TripMemo',{tripId:trip.id, tripName:trip.city})}>
          <View style={{flex:1}}>
            <Text style={s.packingBtnTitle}>🧳 行前打包清单</Text>
            <Text style={s.packingBtnSub}>查看或创建该旅程的打包清单</Text>
          </View>
          <Text style={{color:'#4ECDC4',fontSize:18}}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.addDayBtn} onPress={openAddDay}>
          <Text style={s.addDayIcon}>+</Text>
          <View>
            <Text style={s.addDayText}>记录今天</Text>
            <Text style={s.addDayHint}>{`${today.getFullYear()}.${String(today.getMonth()+1).padStart(2,'0')}.${String(today.getDate()).padStart(2,'0')}`} · {WEEKDAYS[today.getDay()]}</Text>
          </View>
        </TouchableOpacity>

        {trip.days.length===0 ? (
          <View style={s.emptyBox}>
            <View style={s.emptyCard}>
              <Text style={s.emptyEmoji}>📖</Text>
              <Text style={s.emptyTitle}>旅途才刚刚开始</Text>
              <Text style={s.emptyText}>点击上方「记录今天」
把今天的故事留下来</Text>
            </View>
          </View>
        ) : (
          <>
            <Text style={s.sectionTitle}>旅行日志 · {trip.days.length}天</Text>
            {[...trip.days].reverse().map((day,i)=>{
              const photos = day.photos||[];
              return (
                <TouchableOpacity key={day.date} style={s.dayCard}
                  onPress={()=>navigation.navigate('DayDetail',{tripId,dayDate:day.date})}
                  onLongPress={()=>deleteDay(day.date)}>
                  <View style={s.dayLeft}>
                    <Text style={s.dayNumLabel}>DAY</Text>
                    <Text style={s.dayNumBig}>{trip.days.length-i}</Text>
                    <Text style={s.dayWeekText}>{day.weekDay}</Text>
                  </View>
                  <View style={s.dayRight}>
                    <Text style={s.dayDateText}>{day.date}</Text>
                    {day.memos.length>0 && <Text style={s.dayPreview} numberOfLines={2}>{day.memos[0].text}</Text>}
                    {photos.length>0 && (
                      <View style={s.thumbRow}>
                        {photos.slice(0,4).map(p=>(
                          <Image key={String(p.id)} source={{uri:p.uri}} style={s.thumbImg}/>
                        ))}
                        {photos.length>4 && <View style={s.thumbMore}><Text style={s.thumbMoreText}>+{photos.length-4}</Text></View>}
                      </View>
                    )}
                    <View style={s.dayStats}>
                      {day.memos.length>0 && <Text style={s.dayStat}>📝 {day.memos.length}</Text>}
                      {photos.length>0 && <Text style={s.dayStat}>📸 {photos.length}</Text>}
                    </View>
                  </View>
                  <Text style={s.dayArrow}>→</Text>
                </TouchableOpacity>
              );
            })}
          </>
        )}
      </ScrollView>

      {/* 记录今天弹窗 — 使用iOS原生日期选择器 */}
      <Modal visible={showAddDay} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={s.overlay}>
          <View style={s.sheet}>
            <View style={s.sheetHeader}>
              <Text style={s.sheetTitle}>记录这一天</Text>
              <TouchableOpacity onPress={()=>setShowAddDay(false)}><Text style={s.closeBtn}>✕</Text></TouchableOpacity>
            </View>

            {/* iOS原生日期滚轮 */}
            <View style={s.pickerContainer}>
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="spinner"
                maximumDate={new Date()}
                minimumDate={new Date(1990,0,1)}
                onChange={(_,date)=>{ if(date) setSelectedDate(date); }}
                locale="zh-CN"
                style={{height:160}}
                textColor="#F0EDE8"
              />
            </View>

            {/* 日期预览 */}
            <View style={s.datePreview}>
              <Text style={s.datePreviewText}>{dateStr}</Text>
              <Text style={s.datePreviewWeek}>{existsAlready?'✓ 已有记录':weekDay}</Text>
            </View>

            <Text style={s.inputLabel}>写点什么（可选）</Text>
            <TextInput
              style={[s.input,{height:72,textAlignVertical:'top'}]}
              placeholder="今天去了哪里，看到了什么..."
              placeholderTextColor="#444"
              multiline
              value={dayNote}
              onChangeText={setDayNote}
            />

            <TouchableOpacity style={s.confirmBtn} onPress={addDay}>
              <Text style={s.confirmText}>{existsAlready?'进入这天的记录 →':'开始记录 →'}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 编辑旅程名弹窗 */}
      <Modal visible={showEditTrip} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={s.overlay}>
          <View style={s.sheet}>
            <View style={s.sheetHeader}>
              <Text style={s.sheetTitle}>修改旅程名称</Text>
              <TouchableOpacity onPress={()=>setShowEditTrip(false)}><Text style={s.closeBtn}>✕</Text></TouchableOpacity>
            </View>
            <Text style={s.inputLabel}>目的地名称</Text>
            <TextInput
              style={s.input}
              placeholder="城市或景点名称"
              placeholderTextColor="#444"
              value={editCity}
              onChangeText={setEditCity}
              autoFocus
            />
            <Text style={s.inputLabel}>图标</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:16}}>
              <View style={{flexDirection:'row',gap:8}}>
                {['🌍','🗼','🏯','🌋','🏔','🌊','🏝','✈️','🌺','🐢','🦁','🐘','🌅','🎭','🍜','🍣','🏕','🎿','🧗','🗺'].map((e,i)=>(
                  <TouchableOpacity key={i}
                    style={{width:44,height:44,borderRadius:10,backgroundColor:editEmoji===e?'#D4AF3720':'#1A1A1A',borderWidth:1,borderColor:editEmoji===e?'#D4AF37':'#2A2A2A',alignItems:'center',justifyContent:'center'}}
                    onPress={()=>setEditEmoji(e)}>
                    <Text style={{fontSize:22}}>{e}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <View style={{flexDirection:'row',gap:12}}>
              <TouchableOpacity style={s.cancelBtn} onPress={()=>setShowEditTrip(false)}><Text style={s.cancelText}>取消</Text></TouchableOpacity>
              <TouchableOpacity style={s.confirmBtn} onPress={saveEditTrip}><Text style={s.confirmText}>保存</Text></TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      <Modal visible={showEditDate} animationType="slide" transparent>
        <View style={{flex:1,justifyContent:'flex-end',backgroundColor:'#000000BB'}}>
          <View style={{backgroundColor:'#111',borderTopLeftRadius:24,borderTopRightRadius:24,padding:24,paddingBottom:48,borderTopWidth:1,borderColor:'#2A2A2A'}}>
            <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <Text style={{fontSize:20,color:'#F0EDE8',fontWeight:'300'}}>设置出发日期</Text>
              <TouchableOpacity onPress={()=>setShowEditDate(false)}><Text style={{fontSize:18,color:'#555'}}>✕</Text></TouchableOpacity>
            </View>
            <View style={{backgroundColor:'#1A1A1A',borderRadius:14,overflow:'hidden',marginBottom:20}}>
              <DateTimePicker
                value={editDateObj}
                mode="date"
                display="spinner"
                maximumDate={new Date(2035,11,31)}
                onChange={(_,date)=>{ if(date) setEditDateObj(date); }}
                locale="zh-CN"
                style={{height:160}}
                textColor="#F0EDE8"
              />
            </View>
            <View style={{flexDirection:'row',gap:12}}>
              <TouchableOpacity style={{flex:1,padding:16,borderRadius:14,backgroundColor:'#1A1A1A',alignItems:'center'}} onPress={()=>setShowEditDate(false)}>
                <Text style={{color:'#555',fontSize:15}}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{flex:1,padding:16,borderRadius:14,backgroundColor:'#4ECDC4',alignItems:'center'}}
                onPress={()=>{
                  const d = editDateObj;
                  const pd = `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;
                  setTrips(trips.map(t=>t.id===tripId?{...t,plannedDate:pd}:t));
                  setShowEditDate(false);
                }}>
                <Text style={{color:'#0D0D0D',fontSize:15,fontWeight:'700'}}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:{flex:1,backgroundColor:'#0D0D0D'},
  scroll:{padding:24,paddingBottom:100},
  topRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:20},
  backText:{color:'#D4AF37',fontSize:15},
  deleteText:{color:'#FF6B6B',fontSize:13},
  tripHeader:{flexDirection:'row',alignItems:'center',gap:16,marginBottom:24},
  tripEmoji:{fontSize:48},
  tripCity:{fontSize:28,color:'#F0EDE8',fontWeight:'300'},
  editHint:{fontSize:16,color:'#444'},
  tripMeta:{fontSize:14,color:'#555',marginTop:4},
  statsRow:{flexDirection:'row',gap:12,marginBottom:24},
  statBox:{flex:1,backgroundColor:'#161616',borderRadius:12,padding:14,alignItems:'center',borderWidth:1,borderColor:'#242424'},
  statNum:{fontSize:22,color:'#D4AF37',fontWeight:'300'},
  statLabel:{fontSize:10,color:'#555',marginTop:4},
  distanceCard: { flexDirection:'row', alignItems:'center', gap:14, backgroundColor:'#4ECDC415', borderWidth:1, borderColor:'#4ECDC430', borderRadius:14, padding:14, marginBottom:16 },
  weatherCard: { backgroundColor:'#0D2B28', borderWidth:1, borderColor:'#4ECDC430', borderRadius:14, padding:14, marginBottom:16 },
  weatherMain: { flexDirection:'row', alignItems:'center', gap:12, marginBottom:8 },
  weatherEmoji: { fontSize:36 },
  weatherTemp: { fontSize:28, color:'#4ECDC4', fontWeight:'300' },
  weatherDesc: { fontSize:13, color:'#4ECDC490', marginTop:2 },
  weatherToggle: { color:'#4ECDC450', fontSize:12, alignSelf:'flex-start' },
  clothingRow: { flexDirection:'row', alignItems:'center', gap:8, paddingVertical:4 },
  clothingIcon: { fontSize:16, width:24 },
  clothingText: { fontSize:13, color:'#888' },
  distanceIcon: { fontSize:28 },
  distanceLabel: { fontSize:11, color:'#4ECDC490', marginBottom:2 },
  distanceValue: { fontSize:22, color:'#4ECDC4', fontWeight:'300' },
  emptyBox: { alignItems:'center', paddingVertical:24, paddingHorizontal:8 },
  emptyCard: { borderWidth:1, borderColor:'#2A2A2A', borderStyle:'dashed', borderRadius:20, padding:32, alignItems:'center', width:'100%' },
  emptyTitle: { fontSize:18, color:'#F0EDE8', fontWeight:'300', marginBottom:8 },
  emptyText: { fontSize:14, color:'#444', textAlign:'center', lineHeight:20 },
  emptyHint: { fontSize:13, color:"#333", marginTop:6 },
  sectionTitle: { fontSize:13, color:"#555", letterSpacing:2, marginBottom:12, marginTop:8 },
  packingBtn: { flexDirection:'row', alignItems:'center', backgroundColor:'#4ECDC410', borderWidth:1, borderColor:'#4ECDC430', borderRadius:16, padding:16, marginBottom:12 },
  packingBtnTitle: { fontSize:15, color:'#4ECDC4', fontWeight:'400', marginBottom:3 },
  packingBtnSub: { fontSize:12, color:'#4ECDC460' },
  addDayBtn:{backgroundColor:'#D4AF3715',borderWidth:1,borderColor:'#D4AF3740',borderRadius:14,padding:18,flexDirection:'row',alignItems:'center',gap:14,marginBottom:28},
  addDayIcon:{fontSize:28,color:'#D4AF37'},
  addDayText:{fontSize:16,color:'#D4AF37'},
  addDayHint:{fontSize:12,color:'#666',marginTop:3},
  distanceCard: { flexDirection:'row', alignItems:'center', gap:14, backgroundColor:'#4ECDC415', borderWidth:1, borderColor:'#4ECDC430', borderRadius:14, padding:14, marginBottom:16 },
  weatherCard: { backgroundColor:'#0D2B28', borderWidth:1, borderColor:'#4ECDC430', borderRadius:14, padding:14, marginBottom:16 },
  weatherMain: { flexDirection:'row', alignItems:'center', gap:12, marginBottom:8 },
  weatherEmoji: { fontSize:36 },
  weatherTemp: { fontSize:28, color:'#4ECDC4', fontWeight:'300' },
  weatherDesc: { fontSize:13, color:'#4ECDC490', marginTop:2 },
  weatherToggle: { color:'#4ECDC450', fontSize:12, alignSelf:'flex-start' },
  clothingRow: { flexDirection:'row', alignItems:'center', gap:8, paddingVertical:4 },
  clothingIcon: { fontSize:16, width:24 },
  clothingText: { fontSize:13, color:'#888' },
  distanceIcon: { fontSize:28 },
  distanceLabel: { fontSize:11, color:'#4ECDC490', marginBottom:2 },
  distanceValue: { fontSize:22, color:'#4ECDC4', fontWeight:'300' },
  emptyBox:{alignItems:'center',paddingVertical:48},
  emptyEmoji:{fontSize:48,marginBottom:12},
  dayCard:{backgroundColor:'#161616',borderRadius:14,padding:16,marginBottom:10,flexDirection:'row',alignItems:'flex-start',gap:14,borderWidth:1,borderColor:'#242424'},
  dayLeft:{width:48,alignItems:'center',paddingTop:2},
  dayNumLabel:{fontSize:9,color:'#D4AF37',letterSpacing:2},
  dayNumBig:{fontSize:22,color:'#D4AF37',fontWeight:'300'},
  dayWeekText:{fontSize:10,color:'#444',marginTop:2},
  dayRight:{flex:1},
  dayDateText:{fontSize:12,color:'#555',marginBottom:4},
  dayPreview:{fontSize:13,color:'#888',lineHeight:18,marginBottom:8},
  thumbRow:{flexDirection:'row',gap:4,marginBottom:8},
  thumbImg:{width:44,height:44,borderRadius:6,backgroundColor:'#2A2A2A'},
  thumbMore:{width:44,height:44,borderRadius:6,backgroundColor:'#2A2A2A',alignItems:'center',justifyContent:'center'},
  thumbMoreText:{color:'#888',fontSize:11},
  dayStats:{flexDirection:'row',gap:10},
  dayStat:{fontSize:12,color:'#555'},
  dayArrow:{color:'#333',fontSize:16,paddingTop:2},
  overlay:{flex:1,justifyContent:'flex-end',backgroundColor:'#000000BB'},
  sheet:{backgroundColor:'#111',borderTopLeftRadius:24,borderTopRightRadius:24,padding:24,paddingBottom:48,borderTopWidth:1,borderColor:'#2A2A2A'},
  sheetHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:16},
  sheetTitle:{fontSize:20,color:'#F0EDE8',fontWeight:'300'},
  closeBtn:{fontSize:18,color:'#555'},
  pickerContainer:{backgroundColor:'#1A1A1A',borderRadius:14,marginBottom:16,overflow:'hidden'},
  datePreview:{flexDirection:'row',justifyContent:'center',gap:12,alignItems:'center',marginBottom:16,backgroundColor:'#D4AF3715',borderRadius:12,padding:12,borderWidth:1,borderColor:'#D4AF3740'},
  datePreviewText:{fontSize:18,color:'#D4AF37',fontWeight:'300'},
  datePreviewWeek:{fontSize:13,color:'#888'},
  inputLabel:{fontSize:11,color:'#555',letterSpacing:2,textTransform:'uppercase',marginBottom:10},
  input:{backgroundColor:'#1A1A1A',borderRadius:12,padding:14,color:'#F0EDE8',fontSize:15,marginBottom:20,borderWidth:1,borderColor:'#2A2A2A'},
  confirmBtn:{backgroundColor:'#D4AF37',borderRadius:14,padding:16,alignItems:'center'},
  confirmText:{color:'#0D0D0D',fontSize:15,fontWeight:'700'},
  cancelBtn:{flex:1,padding:16,borderRadius:14,backgroundColor:'#1A1A1A',alignItems:'center'},
  cancelText:{color:'#555',fontSize:15},
});
