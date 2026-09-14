import React, { useState, useEffect } from 'react';
import './i18n';
import { useTranslation } from 'react-i18next';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './lib/storageKeys';
import * as SplashScreen from 'expo-splash-screen';
import { geocodeCity } from './lib/geocoding';
import OutdoorGlanceSync from './lib/watch/OutdoorGlanceSync';
import { syncDepartureReminders } from './lib/notifications';
import OnboardingScreen from './screens/OnboardingScreen';
import HomeScreen from './screens/HomeScreen';
import TripDetailScreen from './screens/TripDetailScreen';
import DayDetailScreen from './screens/DayDetailScreen';
import ProfileScreen from './screens/ProfileScreen';
import AIScreen from './screens/AIScreen';
import MapScreen from './screens/MapScreen';
import SearchScreen from './screens/SearchScreen';
import MemoScreen from './screens/MemoScreen';

SplashScreen.preventAutoHideAsync().catch(() => {});

const Stack = createNativeStackNavigator();
const STORAGE_KEY = STORAGE_KEYS.trips;

const INITIAL_TRIPS = [];

// MainApp：业务逻辑和导航。所有数据只存在本机（1.2 起不再有账号和云同步）。
function MainApp() {
  const { t, i18n } = useTranslation();
  const [langKey, setLangKey] = useState(Date.now());
  const [trips, setTripsState] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [hasRetriedPendingGeocodes, setHasRetriedPendingGeocodes] = useState(false);

  useEffect(() => {
    const handleLangChange = (lng) => {
      
      setLangKey(lng);
    };
    i18n.on('languageChanged', handleLangChange);
    return () => i18n.off('languageChanged', handleLangChange);
  }, [i18n]);

  useEffect(() => {
    const loadTrips = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved !== null) {
          try {
            setTripsState(JSON.parse(saved));
          } catch (e) {
            console.warn('本地旅程数据损坏，已重置:', e.message);
            setTripsState(INITIAL_TRIPS);
          }
        } else {
          setTripsState(INITIAL_TRIPS);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_TRIPS));
        }
      } catch (e) {
        console.warn('读取数据失败:', e.message);
        setTripsState(INITIAL_TRIPS);
      } finally {
        setLoaded(true);
      }
    };
    loadTrips();
  }, []);

  const persistTrips = async (next) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.warn('保存数据失败:', e.message);
    }
  };

  useEffect(() => {
    if (hasRetriedPendingGeocodes || !loaded || !Array.isArray(trips) || trips.length === 0) return;

    const pendingTrips = trips.filter(t =>
      !t?.coords && (t?.geocodeStatus === 'pending' || t?.geocodeStatus === 'failed')
    );
    if (pendingTrips.length === 0) {
      setHasRetriedPendingGeocodes(true);
      return;
    }

    let cancelled = false;

    const retryPendingGeocodes = async () => {
      const updates = await Promise.all(
        pendingTrips.map(async trip => {
          const coords = await geocodeCity(trip.city, trip.country).catch(() => null);
          return coords ? { id: trip.id, coords } : null;
        })
      );

      if (cancelled) return;

      setHasRetriedPendingGeocodes(true);

      const resolvedUpdates = updates.filter(Boolean);
      if (resolvedUpdates.length === 0) return;

      setTrips(prev => prev.map(trip => {
        const update = resolvedUpdates.find(item => item.id === trip.id);
        return update ? { ...trip, coords: update.coords, geocodeStatus: 'resolved' } : trip;
      }));
    };

    retryPendingGeocodes();

    return () => {
      cancelled = true;
    };
  }, [hasRetriedPendingGeocodes, loaded, trips]);

  const setTrips = (newTripsOrFn) => {
    setTripsState(prev => {
      const next = typeof newTripsOrFn === 'function'
        ? newTripsOrFn(prev)
        : newTripsOrFn;
      persistTrips(next);
      return next;
    });
  };

  // Departure reminders are rebuilt whenever trips change, so editing or
  // deleting a trip can never leave a reminder behind for it. A no-op when the
  // user has not switched them on.
  useEffect(() => {
    if (!loaded) return;
    syncDepartureReminders(trips, t);
  }, [trips, loaded, t]);

  const tabs = [
    {key:'home', icon:'🗺', label:t('tab_home')},
    {key:'map', icon:'📍', label:t('tab_map')},
    {key:'memo', icon:'📋', label:t('tab_memo')},
    {key:'ai', icon:'✦', label:t('tab_ai')},
    {key:'profile', icon:'👤', label:t('tab_profile')},
  ];

  if (!loaded) return (
    <View style={{flex:1,backgroundColor:'#0D0D0D',alignItems:'center',justifyContent:'center'}}>
      <ActivityIndicator color="#D4AF37" size="large"/>
      <Text style={{color:'#555',marginTop:12,fontSize:13}}>{t('loading')}</Text>
    </View>
  );

  return (
    <View key={langKey} style={{flex:1,backgroundColor:'#0D0D0D'}}>
      <OutdoorGlanceSync trips={trips} loaded={loaded} language={i18n.language}/>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{headerShown:false}}>
          {activeTab==='home' && <>
            <Stack.Screen key={langKey+'Home'} name="Home">{props=><HomeScreen {...props} trips={trips} setTrips={setTrips}/>}</Stack.Screen>
            <Stack.Screen key={langKey+'TripDetail'} name="TripDetail">{props=><TripDetailScreen {...props} trips={trips} setTrips={setTrips}/>}</Stack.Screen>
            <Stack.Screen key={langKey+'DayDetail'} name="DayDetail">{props=><DayDetailScreen {...props} trips={trips} setTrips={setTrips}/>}</Stack.Screen>
            <Stack.Screen key={langKey+'TripMemo'} name="TripMemo">{props=><MemoScreen {...props} trips={trips}/>}</Stack.Screen>
            <Stack.Screen key={langKey+'Search'} name="Search">{props=><SearchScreen {...props} trips={trips}/>}</Stack.Screen>
          </>}
          {activeTab==='memo' && (
            <Stack.Screen key={langKey+'Memo'} name="Memo">{props=><MemoScreen {...props} trips={trips}/>}</Stack.Screen>
          )}
          {activeTab==='map' && (
            <Stack.Screen key={langKey+'Map'} name="Map">{()=><MapScreen trips={trips}/>}</Stack.Screen>
          )}
          {activeTab==='ai' && (
            <Stack.Screen key={langKey+'AI'} name="AI">{()=><AIScreen trips={trips}/>}</Stack.Screen>
          )}
          {activeTab==='profile' && (
            <Stack.Screen key={langKey+'Profile'} name="Profile">{props=><ProfileScreen {...props} trips={trips} onDataRestored={setTripsState}/>}</Stack.Screen>
          )}
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

// App：onboarding gate + splash
export default function App() {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [onboardingLoaded, setOnboardingLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('@wandernote_onboarding_done')
      .then(val => {
        setHasSeenOnboarding(val === 'true');
      })
      .catch(e => {
        console.warn('读取onboarding状态失败:', e.message);
        setHasSeenOnboarding(false);
      })
      .finally(() => {
        setOnboardingLoaded(true);
      });
  }, []);

  useEffect(() => {
    if (onboardingLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [onboardingLoaded]);

  const finishOnboarding = async () => {
    await AsyncStorage.setItem('@wandernote_onboarding_done', 'true');
    setHasSeenOnboarding(true);
  };

  if (!onboardingLoaded) return (
    <View style={{flex:1,backgroundColor:'#0D0D0D',alignItems:'center',justifyContent:'center'}}>
      <ActivityIndicator color="#D4AF37" size="large"/>
    </View>
  );

  if (!hasSeenOnboarding) return <OnboardingScreen onDone={finishOnboarding}/>;
  return <MainApp/>;
}

const st = StyleSheet.create({
  navbar:{flexDirection:'row',backgroundColor:'#0D0D0D',borderTopWidth:1,borderTopColor:'#1E1E1E',paddingBottom:28,paddingTop:10},
  navItem:{flex:1,alignItems:'center',gap:4},
  navIcon:{fontSize:20,color:'#444'},
  navIconActive:{color:'#D4AF37'},
  navLabel:{fontSize:11,color:'#444'},
  navLabelActive:{color:'#D4AF37'},
});
