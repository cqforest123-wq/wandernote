import React, { useState, useEffect } from 'react';
import './i18n';
import { useTranslation } from 'react-i18next';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Alert, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './lib/storageKeys';
import * as SplashScreen from 'expo-splash-screen';
import { initSync, syncTripsUp } from './lib/sync';
import { initPurchases, checkProStatus } from './lib/purchases';
import { ENABLE_PURCHASES, BETA_UNLOCK_PRO } from './lib/featureFlags';
import { supabase } from './lib/supabase';
import AuthScreen from './screens/AuthScreen';
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
import PaywallScreen from './screens/PaywallScreen';

SplashScreen.preventAutoHideAsync().catch(() => {});

const Stack = createNativeStackNavigator();
const FREE_TRIP_LIMIT = 3;
const STORAGE_KEY = STORAGE_KEYS.trips;

const INITIAL_TRIPS = [];

// MainApp：已登录用户的业务逻辑和导航
function MainApp({ session }) {
  const { t, i18n } = useTranslation();
  const [langKey, setLangKey] = useState(Date.now());
  const [trips, setTripsState] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [isPro, setIsPro] = useState(BETA_UNLOCK_PRO);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallFeature, setPaywallFeature] = useState(null);

  useEffect(() => {
    const handleLangChange = (lng) => {
      
      setLangKey(lng);
    };
    i18n.on('languageChanged', handleLangChange);
    return () => i18n.off('languageChanged', handleLangChange);
  }, [i18n]);

  useEffect(() => {
    if (BETA_UNLOCK_PRO) {
      setIsPro(true);
      return;
    }

    if (!ENABLE_PURCHASES) {
      setIsPro(false);
      return;
    }

    if (!session?.user?.id) return;
    initPurchases(session.user.id)
      .then(() => checkProStatus())
      .then(status => setIsPro(Boolean(status)))
      .catch(e => {
        console.warn('RevenueCat init failed:', e.message);
        setIsPro(false);
      });
  }, [session?.user?.id]);

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

  const setTrips = (newTripsOrFn) => {
    setTripsState(prev => {
      const next = typeof newTripsOrFn === 'function'
        ? newTripsOrFn(prev)
        : newTripsOrFn;
      if (!isPro && next.length > prev.length && prev.length >= FREE_TRIP_LIMIT) {
        Alert.alert(
          t('alert_pro_limit'),
          t('alert_pro_limit_desc').replace('%d', FREE_TRIP_LIMIT),
          [
            {text:t('cancel'),style:'cancel'},
            {text:t('alert_upgrade'),onPress:()=>openPaywall(t('profile_unlimited'))}
          ]
        );
        return prev;
      }
      persistTrips(next);
      return next;
    });
  };

  const openPaywall = (featureName) => {
    setPaywallFeature(featureName);
    setShowPaywall(true);
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
      <NavigationContainer>
        <Stack.Navigator screenOptions={{headerShown:false}}>
          {activeTab==='home' && <>
            <Stack.Screen key={langKey+'Home'} name="Home">{props=><HomeScreen {...props} trips={trips} setTrips={setTrips} isPro={isPro} freeTripLimit={FREE_TRIP_LIMIT}/>}</Stack.Screen>
            <Stack.Screen key={langKey+'TripDetail'} name="TripDetail">{props=><TripDetailScreen {...props} trips={trips} setTrips={setTrips}/>}</Stack.Screen>
            <Stack.Screen key={langKey+'DayDetail'} name="DayDetail">{props=><DayDetailScreen {...props} trips={trips} setTrips={setTrips}/>}</Stack.Screen>
            <Stack.Screen key={langKey+'TripMemo'} name="TripMemo">{props=><MemoScreen {...props} isPro={isPro} openPaywall={openPaywall} trips={trips}/>}</Stack.Screen>
          </>}
          {activeTab==='memo' && (
            <Stack.Screen key={langKey+'Memo'} name="Memo">{props=><MemoScreen {...props} isPro={isPro} openPaywall={openPaywall} trips={trips}/>}</Stack.Screen>
          )}
          {activeTab==='map' && (
            <Stack.Screen key={langKey+'Map'} name="Map">{()=><MapScreen trips={trips}/>}</Stack.Screen>
          )}
          {activeTab==='ai' && (
            <Stack.Screen key={langKey+'AI'} name="AI">{()=><AIScreen trips={trips} isPro={isPro} openPaywall={openPaywall}/>}</Stack.Screen>
          )}
          {activeTab==='profile' && <>
            <Stack.Screen key={langKey+'Profile'} name="Profile">{props=><ProfileScreen {...props} session={session} trips={trips} isPro={isPro} openPaywall={openPaywall}/>}</Stack.Screen>
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
      <Modal visible={showPaywall} animationType="slide" presentationStyle="pageSheet">
        <PaywallScreen
          featureName={paywallFeature}
          onSuccess={() => { setIsPro(true); setShowPaywall(false); }}
          onClose={() => setShowPaywall(false)}
        />
      </Modal>
    </View>
  );
}

// App：auth gate + onboarding gate + splash
export default function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [onboardingLoaded, setOnboardingLoaded] = useState(false);

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
    if (!authLoading && onboardingLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [authLoading, onboardingLoaded]);

  const finishOnboarding = async () => {
    await AsyncStorage.setItem('@wandernote_onboarding_done', 'true');
    setHasSeenOnboarding(true);
  };

  if (authLoading || !onboardingLoaded) return (
    <View style={{flex:1,backgroundColor:'#0D0D0D',alignItems:'center',justifyContent:'center'}}>
      <ActivityIndicator color="#D4AF37" size="large"/>
    </View>
  );

  if (!hasSeenOnboarding) return <OnboardingScreen onDone={finishOnboarding}/>;
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
