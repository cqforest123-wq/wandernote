import React, { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '../lib/supabase';



export default function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert('提示','请填写邮箱和密码'); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) Alert.alert('登录失败', error.message);
  };

  const handleRegister = async () => {
    if (!email || !password) { Alert.alert('提示','请填写邮箱和密码'); return; }
    if (password.length < 6) { Alert.alert('提示','密码至少6位'); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) { Alert.alert('注册失败', error.message); return; }
    Alert.alert('注册成功','请查收验证邮件，点击链接后即可登录 📧');
    setMode('login');
  };

  const handleReset = async () => {
    if (!email) { Alert.alert('提示','请填写邮箱'); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);
    if (error) { Alert.alert('失败', error.message); return; }
    Alert.alert('已发送','请查收重置密码邮件 📧');
    setMode('login');
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" />
      <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={s.inner}>

        <View style={s.logoArea}>
          <View style={s.logoIcon}>
            <Text style={{fontSize:52}}>🌊</Text>
          </View>
          <Text style={s.logoTitle}>WanderNote</Text>
          <Text style={s.logoSub}>记录每一次远行</Text>
        </View>

        <View style={s.form}>
          <Text style={s.formTitle}>
            {mode==='login'?'欢迎回来':mode==='register'?'创建账号':'重置密码'}
          </Text>

          <Text style={s.label}>邮箱</Text>
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
            <Text style={s.label}>密码</Text>
            <TextInput
              style={s.input}
              placeholder={mode==='register'?'至少6位':'••••••••'}
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
              {loading?'处理中...':mode==='login'?'登录 →':mode==='register'?'注册':'发送重置邮件'}
            </Text>
          </TouchableOpacity>

          <View style={s.switchRow}>
            {mode==='login' && <>
              <TouchableOpacity onPress={()=>setMode('register')}>
                <Text style={s.switchText}>还没有账号？注册</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={()=>setMode('reset')}>
                <Text style={[s.switchText,{color:'#555'}]}>忘记密码</Text>
              </TouchableOpacity>
            </>}
            {mode!=='login' && (
              <TouchableOpacity onPress={()=>setMode('login')}>
                <Text style={s.switchText}>已有账号？登录</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Text style={s.footer}>你的旅行记忆，安全存储在云端 ☁️</Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:{flex:1,backgroundColor:'#0D0D0D'},
  inner:{flex:1,padding:32,justifyContent:'space-between'},
  logoArea:{alignItems:'center',paddingTop:20},
  logoIcon:{width:100,height:100,borderRadius:24,backgroundColor:'#006994',alignItems:'center',justifyContent:'center',marginBottom:4},
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
