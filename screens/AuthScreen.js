import React, { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';



export default function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert(t('confirm'), t('alert_fill_fields')); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) Alert.alert(t('auth_login_failed'), error.message);
  };

  const handleRegister = async () => {
    if (!email || !password) { Alert.alert(t('confirm'), t('alert_fill_fields')); return; }
    if (password.length < 6) { Alert.alert(t('notice'), t('auth_password_min')); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) { Alert.alert(t('auth_register_failed'), error.message); return; }
    Alert.alert(t('auth_register_success'), t('auth_check_email'));
    setMode('login');
  };

  const handleReset = async () => {
    if (!email) { Alert.alert(t('notice'), t('auth_enter_email')); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);
    if (error) { Alert.alert(t('failed'), error.message); return; }
    Alert.alert(t('auth_sent'), t('auth_reset_email_sent'));
    setMode('login');
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" />
      <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={{flex:1}}>
        <ScrollView
          contentContainerStyle={s.inner}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >

        <View style={s.logoArea}>
          <View style={s.logoIcon}>
            <Text style={{fontSize:52}}>🌺</Text>
          </View>
          <Text style={s.logoTitle}>WanderNote</Text>
          <Text style={s.logoSub}>{t('home_subtitle')}</Text>
        </View>

        <View style={s.form}>
          <Text style={s.formTitle}>
            {mode==='login'?t('auth_welcome'):mode==='register'?t('auth_register'):t('auth_reset')}
          </Text>

          <Text style={s.label}>{t('auth_email')}</Text>
          <TextInput
            style={s.input}
            placeholder="your@email.com"
            placeholderTextColor="#444"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {mode !== 'reset' && <>
            <Text style={s.label}>{t('auth_password')}</Text>
            <TextInput
              style={s.input}
              placeholder={mode==='register'?t('auth_password_min_placeholder'):'••••••••'}
              placeholderTextColor="#444"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </>}

          <TouchableOpacity
            style={[s.mainBtn, loading&&{opacity:0.6}]}
            onPress={mode==='login'?handleLogin:mode==='register'?handleRegister:handleReset}
            disabled={loading}>
            <Text style={s.mainBtnText}>
              {loading?t('auth_processing'):mode==='login'?`${t('auth_login')} →`:mode==='register'?t('auth_register'):t('auth_send_reset')}
            </Text>
          </TouchableOpacity>

          <View style={s.switchRow}>
            {mode==='login' && <>
              <TouchableOpacity onPress={()=>setMode('register')}>
                <Text style={s.switchText}>{t('auth_no_account')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={()=>setMode('reset')}>
                <Text style={[s.switchText,{color:'#555'}]}>{t('auth_forgot_password')}</Text>
              </TouchableOpacity>
            </>}
            {mode!=='login' && (
              <TouchableOpacity onPress={()=>setMode('login')}>
                <Text style={s.switchText}>{t('auth_have_account')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Text style={s.footer}>{t('auth_footer')}</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:{flex:1,backgroundColor:'#0D0D0D'},
  inner:{flexGrow:1,padding:32,justifyContent:'space-between'},
  logoArea:{alignItems:'center',paddingTop:20},
  logoIcon:{width:100,height:100,borderRadius:24,backgroundColor:'#0D1B2A',borderWidth:2,borderColor:'#FF8C5A40',alignItems:'center',justifyContent:'center',marginBottom:4},
  logoTitle:{fontSize:32,color:'#F0EDE8',fontWeight:'300',letterSpacing:2,marginTop:14},
  logoSub:{fontSize:13,color:'#555',marginTop:6},
  form:{backgroundColor:'#161616',borderRadius:20,padding:24,borderWidth:1,borderColor:'#242424'},
  formTitle:{fontSize:20,color:'#F0EDE8',fontWeight:'300',marginBottom:24},
  label:{fontSize:11,color:'#555',letterSpacing:2,textTransform:'uppercase',marginBottom:8},
  input:{backgroundColor:'#1A1A1A',borderRadius:12,padding:14,color:'#F0EDE8',fontSize:15,marginBottom:18,borderWidth:1,borderColor:'#2A2A2A'},
  mainBtn:{backgroundColor:'#D4AF37',borderRadius:14,padding:16,alignItems:'center',marginTop:4},
  mainBtnText:{color:'#0D0D0D',fontSize:16,fontWeight:'700'},
  switchRow:{flexDirection:'row',justifyContent:'space-between',marginTop:16},
  switchText:{color:'#D4AF37',fontSize:13},
  footer:{textAlign:'center',color:'#333',fontSize:12},
});
