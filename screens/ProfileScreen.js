import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View, Alert, Modal, Image, TextInput, Linking } from 'react-native';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileScreen({ session, trips, isPro, onUpgrade, openPaywall, navigation }) {
  const { t } = useTranslation();
  const [showPricing, setShowPricing] = useState(false);
  const [currentLang, setCurrentLang] = useState(i18n.language);

  const toggleLanguage = async () => {
    const newLang = currentLang.startsWith('zh') ? 'en' : 'zh';
    await i18n.changeLanguage(newLang);
    setCurrentLang(newLang);
  };
  const [selectedPlan, setSelectedPlan] = useState('annual');
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [nickname, setNickname] = useState('');
  const [avatarUri, setAvatarUri] = useState(null);

  React.useEffect(() => {
    AsyncStorage.getItem('@wn_nickname').then(v => { if(v) setNickname(v); });
    AsyncStorage.getItem('@wn_avatar').then(v => { if(v) setAvatarUri(v); });
  }, []);

  const saveProfile = async (newNick, newAvatar) => {
    if(newNick !== undefined) { setNickname(newNick); await AsyncStorage.setItem('@wn_nickname', newNick); }
    if(newAvatar !== undefined) { setAvatarUri(newAvatar); await AsyncStorage.setItem('@wn_avatar', newAvatar); }
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
      {text:'取消',style:'cancel'},
      {text:'退出',style:'destructive',onPress:async()=>{ await supabase.auth.signOut(); }},
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
            <Text style={s.nicknameText}>{nickname || '点击设置昵称'}</Text>
          </TouchableOpacity>
          <Text style={s.email}>{email}</Text>
          <TouchableOpacity style={[s.planBadge,isPro&&{backgroundColor:'#D4AF3720',borderColor:'#D4AF3750'}]} onPress={()=>!isPro&&setShowPricing(true)}>
            <Text style={[s.planText,isPro&&{color:'#D4AF37'}]}>{isPro?'✦ Pro 会员':'免费版 · 点击升级'}</Text>
          </TouchableOpacity>
        </View>

        <View style={s.statsGrid}>
          {[
            [String(trips.length),'旅程',isPro?'∞':'3'],
            [String(totalDays),'天数',''],
            [String(totalMemos),'感言',''],
            [String(totalPhotos),'照片',''],
            [String(totalVideos),'视频',''],
          ].map(([n,l,limit])=>(
            <View key={l} style={s.statBox}>
              <Text style={s.statNum}>{n}{limit?<Text style={s.statLimit}>/{limit}</Text>:null}</Text>
              <Text style={s.statLabel}>{l}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={s.reportCard} onPress={()=>navigation.navigate('PhotoFilter')} >
          <View>
            <Text style={s.reportTitle}>🎨 照片滤镜</Text>
            <Text style={s.reportDesc}>复古胶片 · 黑白 · 鲜艳等10种风格</Text>
          </View>
          <Text style={s.reportArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.reportCard} onPress={()=>navigation.navigate('YearReport')}>
          <View>
            <Text style={s.reportTitle}>📊 年度旅行报告</Text>
            <Text style={s.reportDesc}>回顾你的旅行足迹与故事</Text>
          </View>
          <Text style={s.reportArrow}>→</Text>
        </TouchableOpacity>

        {!isPro && (
          <TouchableOpacity style={s.upgradeCard} onPress={()=>openPaywall ? openPaywall('Pro会员') : setShowPricing(true)}>
            <View>
              <Text style={s.upgradeTitle}>✦ 升级到 Pro</Text>
              <Text style={s.upgradeDesc}>无限旅程 · 云端备份 · AI生成图集</Text>
            </View>
            <Text style={s.upgradeArrow}>→</Text>
          </TouchableOpacity>
        )}

        <Text style={s.sectionTitle}>功能对比</Text>
        <View style={s.featureList}>
          {[
            {icon:'🗺',label:'旅程数量',free:'最多3个',pro:'无限'},
            {icon:'☁️',label:'云端备份',free:'❌',pro:'✅'},
            {icon:'🤖',label:'AI生成日记',free:'❌',pro:'✅'},
            {icon:'🖼',label:'图集生成',free:'❌',pro:'✅'},
            {icon:'📸',label:'照片存储',free:'本地',pro:'无限云端'},
            // {icon:'🎬',label:'视频存储',free:'本地',pro:'无限云端'}, // v2.0
            {icon:'📊',label:'年度报告',free:'✅',pro:'✅'},
            {icon:'🎨',label:'照片滤镜',free:'✅',pro:'✅'},
            {icon:'🌐',label:'多语言翻译',free:'✅',pro:'✅'},
          ].map(f=>(
            <View key={f.label} style={s.featureRow}>
              <Text style={s.featureIcon}>{f.icon}</Text>
              <Text style={s.featureLabel}>{f.label}</Text>
              <Text style={[s.featureVal,{color:'#555'}]}>{f.free}</Text>
              <Text style={[s.featureVal,{color:'#D4AF37'}]}>{f.pro}</Text>
            </View>
          ))}
        </View>

        <Text style={s.sectionTitle}>账号设置</Text>
        <View style={s.settingList}>
          <TouchableOpacity style={s.settingRow} onPress={toggleLanguage}>
            <Text style={s.settingIcon}>🌐</Text>
            <Text style={s.settingLabel}>{currentLang.startsWith('zh') ? '切换英文 / Switch to English' : '切换中文 / Switch to Chinese'}</Text>
            <Text style={s.settingArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.settingRow} onPress={()=>Linking.openURL('mailto:predestina@msn.com')}>
            <Text style={s.settingIcon}>📧</Text>
            <Text style={s.settingLabel}>联系我们</Text>
            <Text style={s.settingArrow}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.settingRow} onPress={()=>Linking.openURL('https://cqforest123-wq.github.io/wandernote/privacy-policy.html')}>
            <Text style={s.settingIcon}>🔐</Text>
            <Text style={s.settingLabel}>隐私政策</Text>
            <Text style={s.settingArrow}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.settingRow} onPress={()=>Linking.openURL('https://apps.apple.com/app/idYOUR_APP_ID?action=write-review')}>
            <Text style={s.settingIcon}>⭐</Text>
            <Text style={s.settingLabel}>给App评分</Text>
            <Text style={s.settingArrow}>→</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
          <Text style={s.logoutText}>退出登录</Text>
        </TouchableOpacity>

        <Text style={s.version}>WanderNote v1.0.0 · 记录每一次远行</Text>
      </ScrollView>

      <Modal visible={showEditProfile} animationType="slide" transparent>
        <View style={s.overlay}>
          <TouchableOpacity style={{flex:1}} onPress={()=>setShowEditProfile(false)}/>
          <View style={s.editSheet}>
            <Text style={s.editTitle}>编辑昵称</Text>
            <TextInput
              style={s.editInput}
              placeholder="输入你的旅行昵称..."
              placeholderTextColor="#444"
              value={nickname}
              onChangeText={t=>setNickname(t)}
              autoFocus
              maxLength={20}
              returnKeyType="done"
            />
            <View style={{flexDirection:'row',gap:12,marginTop:8}}>
              <TouchableOpacity style={s.editCancelBtn} onPress={()=>setShowEditProfile(false)}>
                <Text style={{color:'#555',fontSize:15}}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.editSaveBtn} onPress={()=>{saveProfile(nickname);setShowEditProfile(false);}}>
                <Text style={{color:'#0D0D0D',fontSize:15,fontWeight:'700'}}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showPricing} animationType="slide" transparent>
        <View style={s.overlay}>
          <TouchableOpacity style={{flex:1}} onPress={()=>setShowPricing(false)}/>
          <View style={s.pricingSheet}>
            <Text style={s.pricingTitle}>升级到 Pro</Text>
            <Text style={s.pricingSubtitle}>解锁完整旅行记录体验</Text>
            <View style={s.planToggle}>
              {['monthly','annual'].map(p=>(
                <TouchableOpacity key={p} style={[s.planBtn,selectedPlan===p&&s.planBtnActive]} onPress={()=>setSelectedPlan(p)}>
                  <Text style={[s.planBtnText,selectedPlan===p&&s.planBtnTextActive]}>
                    {p==='monthly'?'月付':'年付 省33%'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={s.priceBox}>
              <Text style={s.priceNum}>¥{selectedPlan==='monthly'?'28':'19'}</Text>
              <Text style={s.pricePer}>/ 月{selectedPlan==='annual'?' · 按年付费 ¥228':''}</Text>
            </View>
            {['无限旅程记录','云端自动备份','AI旅行日记生成','一键图集导出','照片视频云存储','年度旅行报告'].map(f=>(
              <View key={f} style={s.pricingFeatureRow}>
                <Text style={s.check}>✦</Text>
                <Text style={s.pricingFeatureText}>{f}</Text>
              </View>
            ))}
            <TouchableOpacity style={s.subscribeBtn} onPress={()=>{ setShowPricing(false); openPaywall && openPaywall('Pro会员'); }}>
              <Text style={s.subscribeBtnText}>立即订阅 →</Text>
            </TouchableOpacity>
            <Text style={s.pricingNote}>随时取消 · 无隐藏费用</Text>
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
