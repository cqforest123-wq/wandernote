import React, { useState, useEffect, useRef } from 'react';
import './i18n';
import { useTranslation } from 'react-i18next';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './lib/storageKeys';
import * as SplashScreen from 'expo-splash-screen';
import { loadLocalTrips, saveLocalTrips } from './lib/localData';
import { preserveTripMedia } from './lib/localMedia';
import { geocodeCity } from './lib/geocoding';
import OutdoorGlanceSync from './lib/watch/OutdoorGlanceSync';
import OnboardingScreen from './screens/OnboardingScreen';
import HomeScreen from './screens/HomeScreen';
import TripDetailScreen from './screens/TripDetailScreen';
import DayDetailScreen from './screens/DayDetailScreen';
import ProfileScreen from './screens/ProfileScreen';
import AIScreen from './screens/AIScreen';
import MapScreen from './screens/MapScreen';
import MemoScreen from './screens/MemoScreen';
import YearReportScreen from './screens/YearReportScreen';
import PhotoFilterScreen from './screens/PhotoFilterScreen';

SplashScreen.preventAutoHideAsync().catch(() => {});

const Stack = createNativeStackNavigator();
function MainApp() {
  const { t, i18n } = useTranslation();
  const [langKey, setLangKey] = useState(Date.now());
  const [trips, setTripsState] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const tripsRef = useRef([]);
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [hasRetriedPendingGeocodes, setHasRetriedPendingGeocodes] = useState(false);

  useEffect(() => {
    const handleLangChange = (lng) => {
      
      setLangKey(lng);
    };
    i18n.on('languageChanged', handleLangChange);
    return () => i18n.off('languageChanged', handleLangChange);
  }, [i18n]);

  useEffect(() => {
    let cancelled = false;
    const loadTrips = async () => {
      setLoadFailed(false);
      try {
        const existing = await loadLocalTrips();
        const saved = await preserveTripMedia(existing);
        if (cancelled) return;
        tripsRef.current = saved;
        setTripsState(saved);
        setLoaded(true);
        if (saved !== existing) persistTrips(saved);
      } catch (e) {
        if (!cancelled) setLoadFailed(true);
      }
    };
    loadTrips();
    return () => { cancelled = true; };
  }, [loadAttempt]);

  const persistTrips = async (next) => {
    try {
      await saveLocalTrips(next);
    } catch (e) {
      Alert.alert(t('local_save_failed'), t('local_save_failed_desc'), [
        { text: t('local_retry'), onPress: () => persistTrips(tripsRef.current) },
        { text: t('cancel'), style: 'cancel' },
      ]);
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
    const next = typeof newTripsOrFn === 'function'
      ? newTripsOrFn(tripsRef.current)
      : newTripsOrFn;
    tripsRef.current = next;
    setTripsState(next);
    persistTrips(next);
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
      {!loadFailed && <ActivityIndicator color="#D4AF37" size="large"/>}
      <Text style={{color:'#888',margin:24,fontSize:14,textAlign:'center'}}>{t(loadFailed ? 'local_load_failed' : 'loading')}</Text>
      {loadFailed && <TouchableOpacity onPress={()=>setLoadAttempt(value=>value+1)}><Text style={{color:'#4ECDC4',padding:16}}>{t('local_retry')}</Text></TouchableOpacity>}
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
          {activeTab==='profile' && <>
            <Stack.Screen key={langKey+'Profile'} name="Profile">{props=><ProfileScreen {...props} trips={trips}/>}</Stack.Screen>
            <Stack.Screen key={langKey+'YearReport'} name="YearReport">{props=><YearReportScreen {...props} trips={trips}/>}</Stack.Screen>
            <Stack.Screen key={langKey+'PhotoFilter'} name="PhotoFilter">{props=><PhotoFilterScreen {...props}/>}</Stack.Screen>
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
  const { t } = useTranslation();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [onboardingLoaded, setOnboardingLoaded] = useState(false);
  const localNoticeShown = useRef(false);

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

  useEffect(() => {
    if (!onboardingLoaded || !hasSeenOnboarding) return;
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEYS.localNotice).then(seen => {
      if (seen === 'true' || cancelled || localNoticeShown.current) return;
      localNoticeShown.current = true;
      Alert.alert(t('local_storage_title'), t('local_storage_notice'), [{
        text: t('ok'),
        onPress: () => AsyncStorage.setItem(STORAGE_KEYS.localNotice, 'true').catch(() => {}),
      }], { cancelable: false });
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [onboardingLoaded, hasSeenOnboarding, t]);

  const finishOnboarding = async () => {
    try {
      await AsyncStorage.setItem('@wandernote_onboarding_done', 'true');
      setHasSeenOnboarding(true);
    } catch {
      Alert.alert(t('local_save_failed'), t('local_save_failed_desc'));
    }
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
