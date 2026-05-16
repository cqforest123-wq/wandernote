import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View, Alert, Modal, Image, TextInput, Linking } from 'react-native';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileScreen({ session, trips, isPro, onUpgrade, openPaywall, navigation }) {
  const { t, i18n } = useTranslation();
  const [showPricing, setShowPricing] = useState(false);
  const [currentLang, setCurrentLang] = useState(i18n.language);

  const LANGS = [
    { code: 'zh', label: '中文' },
    { code: 'en', label: 'English' },
    { code: 'ja', label: '日本語' },
    { code: 'ko', label: '한국어' },
    { code: 'fr', label: 'Français' },
    { code: 'es', label: 'Español' },
    { code: 'th', label: 'ภาษาไทย' },
  ];

const ENABLE_YEAR_REPORT = false;
  const [showLangModal, setShowLangModal] = useState(false);
  const currentLangLabel = LANGS.find(l => currentLang.startsWith(l.code))?.label || 'English';
  const selectLanguage = async (code) => {
    try {
      await i18n.changeLanguage(code);
      await AsyncStorage.setItem('@wandernote_language', code);
      setCurrentLang(code);
      setShowLangModal(false);
    } catch (e) {
      Alert.alert(t('profile_language_switch_failed'), e.message || t('profile_try_later'));
    }
  };
  const [selectedPlan, setSelectedPlan] = useState('annual');
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [nickname, setNickname] = useState('');
  const [avatarUri, setAvatarUri] = useState(null);

  React.useEffect(() => {
    const loadProfile = async () => {
      try {
        const cloudNick = session?.user?.user_metadata?.nickname;
        if (cloudNick) {
          setNickname(cloudNick);
          await AsyncStorage.setItem('@wn_nickname', cloudNick);
        } else {
          const localNick = await AsyncStorage.getItem('@wn_nickname');
          if (localNick) setNickname(localNick);
        }

        const localAvatar = await AsyncStorage.getItem('@wn_avatar');
        if (localAvatar) setAvatarUri(localAvatar);
      } catch (e) {}
    };

    loadProfile();
  }, [session?.user?.id, session?.user?.user_metadata?.nickname]);

  const saveProfile = async (newNick, newAvatar) => {
    if (newNick !== undefined) {
      const cleanNick = String(newNick || '').trim();
      setNickname(cleanNick);
      await AsyncStorage.setItem('@wn_nickname', cleanNick);

      try {
        await supabase.auth.updateUser({
          data: { nickname: cleanNick },
        });
      } catch (e) {}
    }

    if (newAvatar !== undefined) {
      setAvatarUri(newAvatar);
      await AsyncStorage.setItem('@wn_avatar', newAvatar);
    }
  };

  const pickAvatar = async () => {
    const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if(status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({quality:0.8,allowsEditing:true,aspect:[1,1]});
    if(!result.canceled) saveProfile(undefined, result.assets[0].uri);
  };

  const email = session?.user?.email || '';
  const totalDays = trips.reduce((a,t)=>a+t.days.length,0);
  const totalMemos = trips.reduce((a,t)=>a+t.days.reduce((b,d)=>b+d.memos.length,0),0);
  const totalPhotos = trips.reduce((a,t)=>a+t.days.reduce((b,d)=>b+(d.photos||[]).length,0),0);
  const totalVideos = trips.reduce((a,t)=>a+t.days.reduce((b,d)=>b+(d.videos||[]).length,0),0);

  const handleLogout = () => {
    Alert.alert(t('profile_logout'), t('alert_logout_confirm'),[
      {text:t('cancel'),style:'cancel'},
      {text:t('profile_logout_action'),style:'destructive',onPress:async()=>{ await supabase.auth.signOut(); }},
    ]);
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" />
      <ScrollView contentContainerStyle={s.scroll}>

        <View style={s.header}>
          <TouchableOpacity onPress={pickAvatar} style={s.avatarWrap}>
            {avatarUri ? (
              <Image source={{uri:avatarUri}} style={s.avatarImg}/>
            ) : (
              <View style={s.avatar}>
                <Text style={s.avatarText}>{nickname?nickname[0].toUpperCase():email[0]?.toUpperCase()||'W'}</Text>
              </View>
            )}
            <View style={s.avatarEditBadge}><Text style={{fontSize:10}}>✏️</Text></View>
          </TouchableOpacity>
          <TouchableOpacity onPress={()=>setShowEditProfile(true)}>
            <Text style={s.nicknameText}>{nickname || t('profile_set_nickname')}</Text>
          </TouchableOpacity>
          <Text style={s.email}>{email}</Text>
          <TouchableOpacity style={[s.planBadge,isPro&&{backgroundColor:'#D4AF3720',borderColor:'#D4AF3750'}]} onPress={()=>!isPro&&setShowPricing(true)}>
            <Text style={[s.planText,isPro&&{color:'#D4AF37'}]}>{isPro ? t('profile_pro_member') : t('profile_free_upgrade')}</Text>
          </TouchableOpacity>
        </View>

        <View style={s.statsGrid}>
          {[
            [String(trips.length),t('profile_stat_trips'),isPro?'∞':'3'],
            [String(totalDays),t('profile_stat_days'),''],
            [String(totalMemos),t('profile_stat_memos'),''],
            [String(totalPhotos),t('profile_stat_photos'),''],
            [String(totalVideos),t('profile_stat_videos'),''],
          ].map(([n,l,limit])=>(
            <View key={l} style={s.statBox}>
              <Text style={s.statNum}>{n}{limit?<Text style={s.statLimit}>/{limit}</Text>:null}</Text>
              <Text style={s.statLabel}>{l}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={s.reportCard} onPress={()=>navigation.navigate('PhotoFilter')} >
          <View>
            <Text style={s.reportTitle}>🎨 {t('profile_photo_filter')}</Text>
            <Text style={s.reportDesc}>{t('profile_photo_filter_desc')}</Text>
          </View>
          <Text style={s.reportArrow}>→</Text>
        </TouchableOpacity>

        {ENABLE_YEAR_REPORT && (
          <TouchableOpacity style={s.reportCard} onPress={()=>navigation.navigate('YearReport')}>
          <View>
            <Text style={s.reportTitle}>📊 {t('profile_year_report')}</Text>
            <Text style={s.reportDesc}>{t('profile_year_report_desc')}</Text>
          </View>
          <Text style={s.reportArrow}>→</Text>
          </TouchableOpacity>
        )}

        {!isPro && (
          <TouchableOpacity style={s.upgradeCard} onPress={()=>openPaywall ? openPaywall(t('profile_pro_member')) : setShowPricing(true)}>
            <View>
              <Text style={s.upgradeTitle}>✦ {t('profile_upgrade_pro')}</Text>
              <Text style={s.upgradeDesc}>{t('profile_upgrade_desc')}</Text>
            </View>
            <Text style={s.upgradeArrow}>→</Text>
          </TouchableOpacity>
        )}

        <Text style={s.sectionTitle}>{t('profile_feature_compare')}</Text>
        <View style={s.featureList}>
          {[
            {icon:'🗺',label:t('profile_feature_trip_count'),free:t('profile_max_3'),pro:t('profile_unlimited')},
            {icon:'☁️',label:t('profile_feature_cloud_backup'),free:'❌',pro:'✅'},
            {icon:'🤖',label:t('profile_feature_ai_diary'),free:'❌',pro:'✅'},
            {icon:'🖼',label:t('profile_feature_album'),free:'❌',pro:'✅'},
            {icon:'📸',label:t('profile_feature_photo_storage'),free:t('profile_local'),pro:t('profile_unlimited_cloud')},
            // {icon:'🎬',label:'视频存储',free:'本地',pro:'无限云端'}, // v2.0
            {icon:'📊',label:t('profile_feature_year_report'),free:'✅',pro:'✅'},
            {icon:'🎨',label:t('profile_feature_photo_filter'),free:'✅',pro:'✅'},
            {icon:'🌐',label:t('profile_feature_language'),free:'✅',pro:'✅'},
          ].map(f=>(
            <View key={f.label} style={s.featureRow}>
              <Text style={s.featureIcon}>{f.icon}</Text>
              <Text style={s.featureLabel}>{f.label}</Text>
              <Text style={[s.featureVal,{color:'#555'}]}>{f.free}</Text>
              <Text style={[s.featureVal,{color:'#D4AF37'}]}>{f.pro}</Text>
            </View>
          ))}
        </View>

        <Text style={s.sectionTitle}>{t('profile_account_settings')}</Text>
        <View style={s.settingList}>
          <TouchableOpacity style={s.settingRow} onPress={()=>setShowLangModal(true)}>
            <Text style={s.settingIcon}>🌐</Text>
            <Text style={s.settingLabel}>{currentLangLabel}</Text>
            <Text style={s.settingArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.settingRow} onPress={()=>Linking.openURL('mailto:predestina@msn.com')}>
            <Text style={s.settingIcon}>📧</Text>
            <Text style={s.settingLabel}>{t('profile_contact')}</Text>
            <Text style={s.settingArrow}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.settingRow} onPress={()=>Linking.openURL('https://cqforest123-wq.github.io/wandernote/privacy-policy.html')}>
            <Text style={s.settingIcon}>🔐</Text>
            <Text style={s.settingLabel}>{t('profile_privacy_policy')}</Text>
            <Text style={s.settingArrow}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.settingRow} onPress={()=>Linking.openURL('https://apps.apple.com/app/idYOUR_APP_ID?action=write-review')}>
            <Text style={s.settingIcon}>⭐</Text>
            <Text style={s.settingLabel}>{t('profile_rate_app')}</Text>
            <Text style={s.settingArrow}>→</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
          <Text style={s.logoutText}>{t('profile_logout_action')}</Text>
        </TouchableOpacity>

        <Text style={s.version}>WanderNote v1.0.0 · {t('profile_version_slogan')}</Text>
      </ScrollView>

      <Modal visible={showEditProfile} animationType="slide" transparent>
        <View style={s.overlay}>
          <TouchableOpacity style={{flex:1}} onPress={()=>setShowEditProfile(false)}/>
          <View style={s.editSheet}>
            <Text style={s.editTitle}>{t('profile_edit_nickname')}</Text>
            <TextInput
              style={s.editInput}
              placeholder={t("profile_nickname_placeholder")}
              placeholderTextColor="#444"
              value={nickname}
              onChangeText={text=>setNickname(text)}
              autoFocus
              maxLength={20}
              returnKeyType="done"
            />
            <View style={{flexDirection:'row',gap:12,marginTop:8}}>
              <TouchableOpacity style={s.editCancelBtn} onPress={()=>setShowEditProfile(false)}>
                <Text style={{color:'#555',fontSize:15}}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.editSaveBtn} onPress={()=>{saveProfile(nickname);setShowEditProfile(false);}}>
                <Text style={{color:'#0D0D0D',fontSize:15,fontWeight:'700'}}>{t('save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showPricing} animationType="slide" transparent>
        <View style={s.overlay}>
          <TouchableOpacity style={{flex:1}} onPress={()=>setShowPricing(false)}/>
          <View style={s.pricingSheet}>
            <Text style={s.pricingTitle}>{t('profile_upgrade_pro')}</Text>
            <Text style={s.pricingSubtitle}>{t('profile_unlock_full')}</Text>
            <View style={s.planToggle}>
              {['monthly','annual'].map(p=>(
                <TouchableOpacity key={p} style={[s.planBtn,selectedPlan===p&&s.planBtnActive]} onPress={()=>setSelectedPlan(p)}>
                  <Text style={[s.planBtnText,selectedPlan===p&&s.planBtnTextActive]}>
                    {p==='monthly'?t('profile_monthly'):t('profile_annual_save')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={s.priceBox}>
              <Text style={s.priceNum}>¥{selectedPlan==='monthly'?'28':'19'}</Text>
              <Text style={s.pricePer}>/ {t('profile_month')}{selectedPlan==='annual'?` · ${t('profile_billed_yearly')} ¥228`:''}</Text>
            </View>
            {[t('profile_pro_unlimited_trips'),t('profile_pro_cloud_backup'),t('profile_pro_ai_diary'),t('profile_pro_album_export'),t('profile_pro_media_cloud'),t('profile_pro_year_report')].map(f=>(
              <View key={f} style={s.pricingFeatureRow}>
                <Text style={s.check}>✦</Text>
                <Text style={s.pricingFeatureText}>{f}</Text>
              </View>
            ))}
            <TouchableOpacity style={s.subscribeBtn} onPress={()=>{ setShowPricing(false); openPaywall && openPaywall(t('profile_pro_member')); }}>
              <Text style={s.subscribeBtnText}>{t('profile_subscribe_now')} →</Text>
            </TouchableOpacity>
            <Text style={s.pricingNote}>{t('profile_cancel_anytime')}</Text>
          </View>
        </View>
      </Modal>
      {/* 语言选择弹窗 */}
      <Modal visible={showLangModal} animationType="slide" transparent>
        <View style={s.overlay}>
          <TouchableOpacity style={{flex:1}} onPress={()=>setShowLangModal(false)}/>
          <View style={s.editSheet}>
            <Text style={s.editTitle}>{t('profile_select_language')}</Text>
            {LANGS.map(lang=>(
              <TouchableOpacity key={lang.code}
                style={{paddingVertical:14,borderBottomWidth:1,borderBottomColor:'#222',flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}
                onPress={()=>selectLanguage(lang.code)}>
                <Text style={{color:'#F0EDE8',fontSize:16}}>{lang.label}</Text>
                {currentLang.startsWith(lang.code) && <Text style={{color:'#D4AF37',fontSize:16}}>✓</Text>}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={s.editCancelBtn} onPress={()=>setShowLangModal(false)}>
              <Text style={{color:'#555',fontSize:15,textAlign:'center'}}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:{flex:1,backgroundColor:'#0D0D0D'},
  scroll:{padding:24,paddingBottom:60},
  header:{alignItems:'center',paddingVertical:28},
  avatar:{width:72,height:72,borderRadius:36,backgroundColor:'#D4AF3720',borderWidth:2,borderColor:'#D4AF3750',alignItems:'center',justifyContent:'center'},
  avatarWrap:{marginBottom:10,position:'relative'},
  avatarImg:{width:72,height:72,borderRadius:36,borderWidth:2,borderColor:'#D4AF3750'},
  avatarEditBadge:{position:'absolute',bottom:0,right:0,backgroundColor:'#D4AF37',borderRadius:10,width:20,height:20,alignItems:'center',justifyContent:'center'},
  nicknameText:{fontSize:18,color:'#F0EDE8',marginBottom:4,textAlign:'center'},
  editSheet:{backgroundColor:'#111',borderTopLeftRadius:24,borderTopRightRadius:24,padding:24,paddingBottom:48,borderTopWidth:1,borderColor:'#2A2A2A'},
  editTitle:{fontSize:20,color:'#F0EDE8',fontWeight:'300',marginBottom:20,textAlign:'center'},
  editInput:{backgroundColor:'#1A1A1A',borderRadius:12,padding:14,color:'#F0EDE8',fontSize:16,marginBottom:8,borderWidth:1,borderColor:'#2A2A2A',textAlign:'center'},
  editCancelBtn:{flex:1,padding:16,borderRadius:14,backgroundColor:'#1A1A1A',alignItems:'center'},
  editSaveBtn:{flex:1,padding:16,borderRadius:14,backgroundColor:'#D4AF37',alignItems:'center'},
  avatarText:{fontSize:28,color:'#D4AF37'},
  email:{fontSize:15,color:'#888',marginBottom:10},
  planBadge:{backgroundColor:'#1A1A1A',borderWidth:1,borderColor:'#2A2A2A',borderRadius:20,paddingHorizontal:14,paddingVertical:6},
  planText:{fontSize:13,color:'#555'},
  statsGrid:{flexDirection:'row',gap:10,marginBottom:20},
  statBox:{flex:1,backgroundColor:'#161616',borderRadius:12,padding:14,alignItems:'center',borderWidth:1,borderColor:'#242424'},
  statNum:{fontSize:20,color:'#D4AF37',fontWeight:'300'},
  statLimit:{fontSize:11,color:'#555'},
  statLabel:{fontSize:10,color:'#555',marginTop:4},
  reportCard:{backgroundColor:'#0D1A2E',borderWidth:1,borderColor:'#4ECDC440',borderRadius:14,padding:18,flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:12},
  reportTitle:{fontSize:16,color:'#4ECDC4',marginBottom:4},
  reportDesc:{fontSize:12,color:'#888'},
  reportArrow:{color:'#4ECDC4',fontSize:18},
  upgradeCard:{backgroundColor:'#D4AF3715',borderWidth:1,borderColor:'#D4AF3740',borderRadius:14,padding:18,flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:24},
  upgradeTitle:{fontSize:16,color:'#D4AF37',marginBottom:4},
  upgradeDesc:{fontSize:12,color:'#888'},
  upgradeArrow:{color:'#D4AF37',fontSize:18},
  sectionTitle:{fontSize:11,color:'#555',letterSpacing:3,textTransform:'uppercase',marginBottom:12},
  featureList:{backgroundColor:'#161616',borderRadius:14,borderWidth:1,borderColor:'#242424',marginBottom:24,overflow:'hidden'},
  featureRow:{flexDirection:'row',alignItems:'center',padding:14,borderBottomWidth:1,borderBottomColor:'#1E1E1E',gap:10},
  featureIcon:{fontSize:16,width:24},
  featureLabel:{flex:1,fontSize:14,color:'#888'},
  featureVal:{width:56,fontSize:12,textAlign:'center'},
  settingList:{backgroundColor:'#161616',borderRadius:14,borderWidth:1,borderColor:'#242424',marginBottom:20,overflow:'hidden'},
  settingRow:{flexDirection:'row',alignItems:'center',padding:16,borderBottomWidth:1,borderBottomColor:'#1E1E1E',gap:12},
  settingIcon:{fontSize:18,width:28},
  settingLabel:{flex:1,fontSize:15,color:'#C8C4BC'},
  settingArrow:{color:'#444',fontSize:14},
  logoutBtn:{borderWidth:1,borderColor:'#FF6B6B40',borderRadius:14,padding:16,alignItems:'center',marginBottom:20},
  logoutText:{color:'#FF6B6B',fontSize:15},
  version:{textAlign:'center',color:'#333',fontSize:11},
  overlay:{flex:1,backgroundColor:'#000000BB',justifyContent:'flex-end'},
  pricingSheet:{backgroundColor:'#111',borderTopLeftRadius:24,borderTopRightRadius:24,padding:28,paddingBottom:48,borderTopWidth:1,borderColor:'#2A2A2A'},
  pricingTitle:{fontSize:24,color:'#F0EDE8',fontWeight:'300',textAlign:'center',marginBottom:6},
  pricingSubtitle:{fontSize:14,color:'#555',textAlign:'center',marginBottom:24},
  planToggle:{flexDirection:'row',backgroundColor:'#1A1A1A',borderRadius:12,padding:4,marginBottom:20},
  planBtn:{flex:1,padding:10,borderRadius:10,alignItems:'center'},
  planBtnActive:{backgroundColor:'#D4AF37'},
  planBtnText:{fontSize:14,color:'#555'},
  planBtnTextActive:{color:'#0D0D0D',fontWeight:'700'},
  priceBox:{alignItems:'center',marginBottom:20},
  priceNum:{fontSize:48,color:'#D4AF37',fontWeight:'300'},
  pricePer:{fontSize:13,color:'#555'},
  pricingFeatureRow:{flexDirection:'row',gap:10,alignItems:'center',paddingVertical:8,borderBottomWidth:1,borderBottomColor:'#1A1A1A'},
  check:{color:'#D4AF37',fontSize:12},
  pricingFeatureText:{fontSize:14,color:'#888'},
  subscribeBtn:{backgroundColor:'#D4AF37',borderRadius:14,padding:16,alignItems:'center',marginTop:20,marginBottom:8},
  subscribeBtnText:{color:'#0D0D0D',fontSize:16,fontWeight:'700'},
  pricingNote:{textAlign:'center',color:'#444',fontSize:12},
});
