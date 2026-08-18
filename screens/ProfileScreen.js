import React, { useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View, Alert, Modal, Image, TextInput, Linking } from 'react-native';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { deleteCurrentAccount } from '../lib/accountDeletion';
import { exportBackup, importBackup, estimatePhotoBytes, PHOTO_SIZE_WARN_BYTES } from '../lib/backup';
import { COMMON_CURRENCIES, DEFAULT_HOME_CURRENCY, currencySymbol, getHomeCurrency, setHomeCurrency } from '../lib/currency';
import { areRemindersEnabled, setRemindersEnabled } from '../lib/notifications';
// 直接读 app.json，避免版本号在这里再次写死后跟着 bump 漂移
import appConfig from '../app.json';

const APP_VERSION = appConfig.expo.version;

export default function ProfileScreen({ session, trips, navigation, onRequestSignIn, onDataRestored }) {
  // 游客模式：没有 session，数据只在本机，不显示登出/注销账号。
  const isGuest = !session;
  const { t, i18n } = useTranslation();
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

  const [showLangModal, setShowLangModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [homeCurrency, setHomeCurrencyState] = useState(DEFAULT_HOME_CURRENCY);

  useEffect(() => {
    getHomeCurrency().then(setHomeCurrencyState);
  }, []);

  const [remindersOn, setRemindersOn] = useState(false);
  const [togglingReminders, setTogglingReminders] = useState(false);

  useEffect(() => {
    areRemindersEnabled().then(setRemindersOn);
  }, []);

  // The permission prompt only ever appears here, when the user reaches for the
  // switch. If they decline, the switch goes back rather than lying.
  const toggleReminders = async () => {
    if (togglingReminders) return;
    setTogglingReminders(true);
    try {
      const next = await setRemindersEnabled(!remindersOn, trips, t);
      setRemindersOn(next);
      if (!remindersOn && !next) {
        Alert.alert(t('notify_denied_title'), t('notify_denied_body'));
      }
    } finally {
      setTogglingReminders(false);
    }
  };

  const selectCurrency = async (code) => {
    setHomeCurrencyState(code);
    setShowCurrencyModal(false);
    await setHomeCurrency(code);
  };
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
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [nickname, setNickname] = useState('');
  const [avatarUri, setAvatarUri] = useState(null);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

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

  const formatMB = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

  const runExport = async (includePhotos) => {
    try {
      setIsExporting(true);
      const r = await exportBackup({ includePhotos });
      const parts = [
        t('backup_export_done_trips').replace('%d', r.tripCount),
        t('backup_export_done_lists').replace('%d', r.memoCount),
      ];
      if (r.photoFailed > 0) {
        parts.push(t('backup_export_photos_failed').replace('%d', r.photoFailed));
      }
      Alert.alert(t('backup_export_done'), parts.join('\n'));
    } catch (e) {
      // 用户在分享面板点取消也会走到这里，不必当成错误吓唬人
      if (!/cancel/i.test(e?.message || '')) {
        Alert.alert(t('backup_export_failed'), e?.message || t('profile_try_later'));
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleExport = async () => {
    if (isExporting) return;
    try {
      // 相机拍的照片只在 app 沙盒里，系统相册没有副本，所以默认要带上。
      // 但整包可能很大，先估一下体积再让用户决定。
      const est = await estimatePhotoBytes(trips);
      if (est.count > 0 && est.encodedBytes > PHOTO_SIZE_WARN_BYTES) {
        Alert.alert(
          t('backup_large_title'),
          t('backup_large_message')
            .replace('%d', est.count)
            .replace('%s', formatMB(est.encodedBytes)),
          [
            { text: t('cancel'), style: 'cancel' },
            { text: t('backup_without_photos'), onPress: () => runExport(false) },
            { text: t('backup_with_photos'), onPress: () => runExport(true) },
          ]
        );
        return;
      }
      await runExport(true);
    } catch (e) {
      setIsExporting(false);
      Alert.alert(t('backup_export_failed'), e?.message || t('profile_try_later'));
    }
  };

  const handleImport = async () => {
    if (isImporting) return;
    try {
      setIsImporting(true);
      const r = await importBackup();
      if (!r) return; // 用户取消了选择
      Alert.alert(
        t('backup_import_done'),
        [
          t('backup_import_added').replace('%d', r.addedTrips).replace('%m', r.addedMemos),
          r.skippedTrips + r.skippedMemos > 0
            ? t('backup_import_skipped').replace('%d', r.skippedTrips + r.skippedMemos)
            : null,
          r.restoredPhotos > 0
            ? t('backup_import_photos').replace('%d', r.restoredPhotos)
            : null,
        ].filter(Boolean).join('\n'),
        [{ text: t('ok'), onPress: () => onDataRestored && onDataRestored(r.trips) }]
      );
    } catch (e) {
      const key = e?.message === 'NOT_A_BACKUP' || e?.message === 'INVALID_JSON'
        ? 'backup_import_invalid'
        : 'backup_import_failed';
      Alert.alert(t('backup_import_failed'), t(key));
    } finally {
      setIsImporting(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(t('profile_logout'), t('alert_logout_confirm'),[
      {text:t('cancel'),style:'cancel'},
      {text:t('profile_logout_action'),style:'destructive',onPress:async()=>{ await supabase.auth.signOut(); }},
    ]);
  };

  const handleDeleteAccount = () => {
    if (isDeletingAccount) return;

    Alert.alert(
      t('profile_delete_account_title'),
      t('profile_delete_account_message'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('profile_delete_account_confirm'),
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              t('profile_delete_account_final_title'),
              t('profile_delete_account_final_message'),
              [
                { text: t('cancel'), style: 'cancel' },
                {
                  text: t('profile_delete_account_final_confirm'),
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      setIsDeletingAccount(true);
                      await deleteCurrentAccount();
                    } catch (e) {
                      Alert.alert(t('profile_delete_account_failed'), e?.message || t('profile_try_later'));
                    } finally {
                      setIsDeletingAccount(false);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
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
          <Text style={s.email}>{isGuest ? t('profile_guest_desc') : email}</Text>
          <View style={s.planBadge}>
            <Text style={s.planText}>{isGuest ? t('profile_guest_title') : t('profile_free')}</Text>
          </View>
        </View>

        <View style={s.statsGrid}>
          {[
            [String(trips.length),t('profile_stat_trips')],
            [String(totalDays),t('profile_stat_days')],
            [String(totalMemos),t('profile_stat_memos')],
            [String(totalPhotos),t('profile_stat_photos')],
          ].map(([n,l])=>(
            <View key={l} style={s.statBox}>
              <Text style={s.statNum}>{n}</Text>
              <Text style={s.statLabel}>{l}</Text>
            </View>
          ))}
        </View>

        <Text style={s.sectionTitle}>{t('profile_data')}</Text>
        <View style={s.settingList}>
          <TouchableOpacity style={s.settingRow} onPress={handleExport} disabled={isExporting}>
            <Text style={s.settingIcon}>📦</Text>
            <Text style={s.settingLabel}>
              {isExporting ? t('backup_exporting') : t('backup_export')}
            </Text>
            <Text style={s.settingArrow}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.settingRow} onPress={handleImport} disabled={isImporting}>
            <Text style={s.settingIcon}>📥</Text>
            <Text style={s.settingLabel}>
              {isImporting ? t('backup_importing') : t('backup_import')}
            </Text>
            <Text style={s.settingArrow}>→</Text>
          </TouchableOpacity>
        </View>
        <Text style={s.settingHint}>{t('backup_hint')}</Text>

        <Text style={s.sectionTitle}>{t('profile_account_settings')}</Text>
        <View style={s.settingList}>
          <TouchableOpacity style={s.settingRow} onPress={()=>setShowLangModal(true)}>
            <Text style={s.settingIcon}>🌐</Text>
            <Text style={s.settingLabel}>{currentLangLabel}</Text>
            <Text style={s.settingArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.settingRow} onPress={toggleReminders} disabled={togglingReminders}>
            <Text style={s.settingIcon}>🔔</Text>
            <Text style={s.settingLabel}>{t('notify_departure_setting')}</Text>
            <Text style={[s.settingValue, remindersOn && {color:'#D4AF37'}]}>
              {remindersOn ? t('notify_on') : t('notify_off')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.settingRow} onPress={()=>setShowCurrencyModal(true)}>
            <Text style={s.settingIcon}>💱</Text>
            <Text style={s.settingLabel}>{t('expense_home_currency')}</Text>
            <Text style={s.settingValue}>{homeCurrency}</Text>
            <Text style={s.settingArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.settingRow} onPress={()=>Linking.openURL('mailto:cqforest123@gmail.com')}>
            <Text style={s.settingIcon}>📧</Text>
            <Text style={s.settingLabel}>{t('profile_contact')}</Text>
            <Text style={s.settingArrow}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.settingRow} onPress={()=>Linking.openURL('https://cqforest123-wq.github.io/wandernote/privacy-policy.html')}>
            <Text style={s.settingIcon}>🔐</Text>
            <Text style={s.settingLabel}>{t('profile_privacy_policy')}</Text>
            <Text style={s.settingArrow}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.settingRow} onPress={()=>Linking.openURL('https://apps.apple.com/app/id6769281736?action=write-review')}>
            <Text style={s.settingIcon}>⭐</Text>
            <Text style={s.settingLabel}>{t('profile_rate_app')}</Text>
            <Text style={s.settingArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {isGuest ? (
          <TouchableOpacity style={s.signInBtn} onPress={onRequestSignIn}>
            <Text style={s.signInText}>{t('profile_sign_in_to_sync')}</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity style={s.deleteAccountBtn} onPress={handleDeleteAccount} disabled={isDeletingAccount}>
              <Text style={s.deleteAccountText}>
                {isDeletingAccount ? t('profile_deleting_account') : t('profile_delete_account')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
              <Text style={s.logoutText}>{t('profile_logout_action')}</Text>
            </TouchableOpacity>
          </>
        )}

        <Text style={s.version}>WanderNote v{APP_VERSION} · {t('profile_version_slogan')}</Text>
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

      {/* 本币选择 */}
      <Modal visible={showCurrencyModal} animationType="slide" transparent>
        <View style={s.overlay}>
          <TouchableOpacity style={{flex:1}} onPress={()=>setShowCurrencyModal(false)}/>
          <View style={s.editSheet}>
            <Text style={s.editTitle}>{t('expense_home_currency')}</Text>
            <ScrollView style={{maxHeight:320}}>
              {COMMON_CURRENCIES.map(item=>(
                <TouchableOpacity key={item.code}
                  style={{paddingVertical:14,borderBottomWidth:1,borderBottomColor:'#222',flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}
                  onPress={()=>selectCurrency(item.code)}>
                  <Text style={{color:'#F0EDE8',fontSize:16}}>{`${item.code}  ${currencySymbol(item.code)}`}</Text>
                  {homeCurrency===item.code && <Text style={{color:'#D4AF37',fontSize:16}}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={s.editCancelBtn} onPress={()=>setShowCurrencyModal(false)}>
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
  statLabel:{fontSize:10,color:'#555',marginTop:4},
  reportCard:{backgroundColor:'#0D1A2E',borderWidth:1,borderColor:'#4ECDC440',borderRadius:14,padding:18,flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:12},
  reportTitle:{fontSize:16,color:'#4ECDC4',marginBottom:4},
  reportDesc:{fontSize:12,color:'#888'},
  reportArrow:{color:'#4ECDC4',fontSize:18},
  sectionTitle:{fontSize:11,color:'#555',letterSpacing:3,textTransform:'uppercase',marginBottom:12},
  settingList:{backgroundColor:'#161616',borderRadius:14,borderWidth:1,borderColor:'#242424',marginBottom:20,overflow:'hidden'},
  settingRow:{flexDirection:'row',alignItems:'center',padding:16,borderBottomWidth:1,borderBottomColor:'#1E1E1E',gap:12},
  settingIcon:{fontSize:18,width:28},
  settingLabel:{flex:1,fontSize:15,color:'#C8C4BC'},
  settingArrow:{color:'#444',fontSize:14},
  settingValue:{color:'#666',fontSize:14},
  deleteAccountBtn:{borderWidth:1,borderColor:'#FF6B6B70',borderRadius:14,padding:16,alignItems:'center',marginBottom:12,backgroundColor:'#FF6B6B10'},
  deleteAccountText:{color:'#FF6B6B',fontSize:15,fontWeight:'700'},
  settingHint:{fontSize:12,color:'#555',lineHeight:18,marginTop:8,marginBottom:4,paddingHorizontal:4},
  signInBtn:{borderWidth:1,borderColor:'#D4AF3760',borderRadius:14,padding:16,alignItems:'center',marginBottom:20,backgroundColor:'#D4AF3710'},
  signInText:{color:'#D4AF37',fontSize:15,fontWeight:'600'},
  logoutBtn:{borderWidth:1,borderColor:'#FF6B6B40',borderRadius:14,padding:16,alignItems:'center',marginBottom:20},
  logoutText:{color:'#FF6B6B',fontSize:15},
  version:{textAlign:'center',color:'#333',fontSize:11},
  overlay:{flex:1,backgroundColor:'#000000BB',justifyContent:'flex-end'},
});
