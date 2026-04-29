import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './lib/supabase';
import AuthScreen from './screens/AuthScreen';
import HomeScreen from './screens/HomeScreen';
import TripDetailScreen from './screens/TripDetailScreen';
import DayDetailScreen from './screens/DayDetailScreen';
import ProfileScreen from './screens/ProfileScreen';
import AIScreen from './screens/AIScreen';
import MapScreen from './screens/MapScreen';
import YearReportScreen from './screens/YearReportScreen';
import PhotoFilterScreen from './screens/PhotoFilterScreen';

const Stack = createNativeStackNavigator();
const FREE_TRIP_LIMIT = 3;
const STORAGE_KEY = '@wandernote_trips';

const INITIAL_TRIPS = [
  { id:1, city:'京都', country:'日本', date:'2026.03', emoji:'🗼', days:[
    { date:'2026.03.15', weekDay:'周日', memos:[{id:1,text:'清晨的岚山竹林，只有风声',tag:'风景',time:'07:30'},{id:2,text:'嵯峨野的豆腐料理，入口即化',tag:'美食',time:'12:15'}], photos:[], videos:[] },
    { date:'2026.03.16', weekDay:'周一', memos:[{id:3,text:'伏见稻荷大社，千本鸟居在晨雾中若隐若现',tag:'探险',time:'09:00'}], photos:[], videos:[] },
  ]},
  { id:2, city:'雷克雅未克', country:'冰岛', date:'2025.11', emoji:'🌋', days:[] },
];

function MainApp({ session }) {
  const [trips, setTripsState] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const isPro = false;

  // 启动时从本地读取数据
  useEffect(() => {
    const loadTrips = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved !== null) {
          setTripsState(JSON.parse(saved));
        } else {
          // 第一次启动，用初始数据
          setTripsState(INITIAL_TRIPS);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_TRIPS));
        }
      } catch (e) {
        console.log('读取数据失败:', e);
        setTripsState(INITIAL_TRIPS);
      } finally {
        setLoaded(true);
      }
    };
    loadTrips();
  }, []);

  // 每次 trips 变化自动保存
  const setTrips = async (newTripsOrFn) => {
    const newTrips = typeof newTripsOrFn === 'function' ? newTripsOrFn(trips) : newTripsOrFn;
    if (!isPro && newTrips.length > trips.length && trips.length >= FREE_TRIP_LIMIT) {
      Alert.alert('已达免费版上限',
        `免费版最多记录 ${FREE_TRIP_LIMIT} 个旅程\n升级 Pro 即可无限记录`,
        [{text:'暂不',style:'cancel'},{text:'去升级',onPress:()=>setActiveTab('profile')}]
      );
      return;
    }
    setTripsState(newTrips);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newTrips));
    } catch (e) {
      console.log('保存数据失败:', e);
    }
  };

  const tabs = [
    {key:'home', icon:'🗺', label:'旅程'},
    {key:'map', icon:'📍', label:'足迹'},
    {key:'ai', icon:'✦', label:'AI'},
    {key:'profile', icon:'👤', label:'我的'},
  ];

  if (!loaded) return (
    <View style={{flex:1,backgroundColor:'#0D0D0D',alignItems:'center',justifyContent:'center'}}>
      <ActivityIndicator color="#D4AF37" size="large"/>
      <Text style={{color:'#555',marginTop:12,fontSize:13}}>加载中...</Text>
    </View>
  );

  return (
    <View style={{flex:1,backgroundColor:'#0D0D0D'}}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{headerShown:false}}>
          {activeTab==='home' && <>
            <Stack.Screen name="Home">{props=><HomeScreen {...props} trips={trips} setTrips={setTrips} isPro={isPro} freeTripLimit={FREE_TRIP_LIMIT}/>}</Stack.Screen>
            <Stack.Screen name="TripDetail">{props=><TripDetailScreen {...props} trips={trips} setTrips={setTrips}/>}</Stack.Screen>
            <Stack.Screen name="DayDetail">{props=><DayDetailScreen {...props} trips={trips} setTrips={setTrips}/>}</Stack.Screen>
          </>}
          {activeTab==='map' && (
            <Stack.Screen name="Map">{()=><MapScreen trips={trips}/>}</Stack.Screen>
          )}
          {activeTab==='ai' && (
            <Stack.Screen name="AI">{()=><AIScreen trips={trips}/>}</Stack.Screen>
          )}
          {activeTab==='profile' && <>
            <Stack.Screen name="Profile">{props=><ProfileScreen {...props} session={session} trips={trips} isPro={isPro}/>}</Stack.Screen>
            <Stack.Screen name="YearReport">{props=><YearReportScreen {...props} trips={trips}/>}</Stack.Screen>
            <Stack.Screen name="PhotoFilter">{props=><PhotoFilterScreen {...props}/>}</Stack.Screen>
          </>}
        </Stack.Navigator>
      </NavigationContainer>

      <View style={st.navbar}>
        {tabs.map(tab=>(
          <TouchableOpacity key={tab.key} style={st.navItem} onPress={()=>setActiveTab(tab.key)}>
            <Text style={[st.navIcon, activeTab===tab.key&&st.navIconActive]}>{tab.icon}</Text>
            <Text style={[st.navLabel, activeTab===tab.key&&st.navLabelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({data:{session}})=>{ setSession(session); setLoading(false); });
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_,session)=>setSession(session));
    return ()=>subscription.unsubscribe();
  }, []);

  if (loading) return (
    <View style={{flex:1,backgroundColor:'#0D0D0D',alignItems:'center',justifyContent:'center'}}>
      <ActivityIndicator color="#D4AF37" size="large"/>
    </View>
  );

  if (!session) return <AuthScreen/>;
  return <MainApp session={session}/>;
}

const st = StyleSheet.create({
  navbar:{flexDirection:'row',backgroundColor:'#0D0D0D',borderTopWidth:1,borderTopColor:'#1E1E1E',paddingBottom:28,paddingTop:10},
  navItem:{flex:1,alignItems:'center',gap:4},
  navIcon:{fontSize:20,color:'#444'},
  navIconActive:{color:'#D4AF37'},
  navLabel:{fontSize:11,color:'#444'},
  navLabelActive:{color:'#D4AF37'},
});
