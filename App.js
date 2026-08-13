import React, { useState, useEffect } from 'react';
import './i18n';
import { useTranslation } from 'react-i18next';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './lib/storageKeys';
import * as SplashScreen from 'expo-splash-screen';
import { initSync, syncTripsUp } from './lib/sync';
import { supabase } from './lib/supabase';
import { geocodeCity } from './lib/geocoding';
import OutdoorGlanceSync from './lib/watch/OutdoorGlanceSync';
import AuthScreen from './screens/AuthScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import HomeScreen from './screens/HomeScreen';
import TripDetailScreen from './screens/TripDetailScreen';
import DayDetailScreen from './screens/DayDetailScreen';
import ProfileScreen from './screens/ProfileScreen';
import AIScreen from './screens/AIScreen';
import MapScreen from './screens/MapScreen';
import MemoScreen from './screens/MemoScreen';

SplashScreen.preventAutoHideAsync().catch(() => {});

const Stack = createNativeStackNavigator();
const STORAGE_KEY = STORAGE_KEYS.trips;
const GUEST_MODE_KEY = '@wandernote_guest_mode';

const INITIAL_TRIPS = [];

// MainApp：业务逻辑和导航。session 为 null 时即游客模式，全部数据留在本机。
function MainApp({ session, onRequestSignIn }) {
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
        const userId = session?.user?.id;
        if (userId) {
          const { trips: cloudTrips } = await initSync(userId);
          if (Array.isArray(cloudTrips)) {
            setTripsState(cloudTrips);
            setLoaded(true);
            return;
          }
        }
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
      const userId = session?.user?.id;
      if (userId) syncTripsUp(userId, next);
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
            <Stack.Screen key={langKey+'Profile'} name="Profile">{props=><ProfileScreen {...props} session={session} trips={trips} onRequestSignIn={onRequestSignIn} onDataRestored={setTripsState}/>}</Stack.Screen>
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

// App：auth gate + onboarding gate + splash
export default function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [onboardingLoaded, setOnboardingLoaded] = useState(false);
  // 游客模式：不登录也能完整使用。账号只用于可选的跨设备同步。
  const [guestMode, setGuestMode] = useState(false);
  const [guestLoaded, setGuestLoaded] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setAuthLoading(false), 10000);
    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(timeout);
      setSession(session);
      setAuthLoading(false);
    }).catch(() => {
      clearTimeout(timeout);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setSession(session);
      // 一旦真正登录，就退出游客标记，之后登出会正常回到登录页而不是又静默进游客模式。
      if (session) {
        setGuestMode(false);
        AsyncStorage.removeItem(GUEST_MODE_KEY).catch(() => {});
      }
    });
    return () => { subscription.unsubscribe(); clearTimeout(timeout); };
  }, []);

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
    AsyncStorage.getItem(GUEST_MODE_KEY)
      .then(val => setGuestMode(val === 'true'))
      .catch(() => setGuestMode(false))
      .finally(() => setGuestLoaded(true));
  }, []);

  useEffect(() => {
    if (!authLoading && onboardingLoaded && guestLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [authLoading, onboardingLoaded, guestLoaded]);

  const finishOnboarding = async () => {
    await AsyncStorage.setItem('@wandernote_onboarding_done', 'true');
    setHasSeenOnboarding(true);
  };

  const continueAsGuest = async () => {
    setGuestMode(true);
    await AsyncStorage.setItem(GUEST_MODE_KEY, 'true').catch(() => {});
  };

  // 从游客模式回到登录页。本地旅程数据保持不变。
  const requestSignIn = async () => {
    setGuestMode(false);
    await AsyncStorage.removeItem(GUEST_MODE_KEY).catch(() => {});
  };

  if (authLoading || !onboardingLoaded || !guestLoaded) return (
    <View style={{flex:1,backgroundColor:'#0D0D0D',alignItems:'center',justifyContent:'center'}}>
      <ActivityIndicator color="#D4AF37" size="large"/>
    </View>
  );

  if (!hasSeenOnboarding) return <OnboardingScreen onDone={finishOnboarding}/>;
  if (!session && !guestMode) return <AuthScreen onContinueAsGuest={continueAsGuest}/>;
  return <MainApp session={session} onRequestSignIn={session ? null : requestSignIn}/>;
}

const st = StyleSheet.create({
  navbar:{flexDirection:'row',backgroundColor:'#0D0D0D',borderTopWidth:1,borderTopColor:'#1E1E1E',paddingBottom:28,paddingTop:10},
  navItem:{flex:1,alignItems:'center',gap:4},
  navIcon:{fontSize:20,color:'#444'},
  navIconActive:{color:'#D4AF37'},
  navLabel:{fontSize:11,color:'#444'},
  navLabelActive:{color:'#D4AF37'},
});
