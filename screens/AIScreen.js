import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator, Alert, Share } from 'react-native';
import { useTranslation } from 'react-i18next';
import { callClaude } from '../lib/claude';

export default function AIScreen({ trips, isPro, openPaywall }) {
  const { t } = useTranslation();
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState('');
  const [itineraryDest, setItineraryDest] = useState('');
  const [itineraryDays, setItineraryDays] = useState('5');
  const [itineraryStyle, setItineraryStyle] = useState('综合');
  const [mode, setMode] = useState('diary');

  const MODES = [
    { key:'diary', label:t('ai_diary'), desc:t('ai_diary_desc') },
    { key:'social', label:t('ai_social'), desc:t('ai_social_desc') },
    { key:'packing', label:'🧳 AI Packing List', desc:'Generate a smart packing list for your trip' },
    { key:'summary', label:t('ai_summary'), desc:t('ai_summary_desc') },
    { key:'itinerary', label:'🗺 AI 路书生成', desc:'输入目的地，AI规划完整行程' },
  ];

  const buildPrompt = () => {
    if (mode === 'summary') {
      const trip = selectedTrip;
      const allMemos = trip.days.flatMap(d => d.memos.map(m => `[${d.date} ${m.tag}] ${m.text}`));
      return `你是一位擅长写旅行文章的作家。请根据以下旅行记录，写一篇完整的旅程总结文章。

旅行地点：${trip.city}，${trip.country}
旅行时间：${trip.date}
共${trip.days.length}天，${allMemos.length}条感言

感言记录：
${allMemos.length > 0 ? allMemos.join('\n') : '（无文字记录）'}

要求：
- 用第一人称，真实感人的笔触
- 结构：开篇→行程亮点→感悟收尾
- 字数600-800字，中文，文笔优美有画面感`;
    }

    if (mode === 'social') {
      const day = selectedDay;
      const memos = day.memos.map(m => m.text).join('；');
      return `你是一位擅长写小红书/朋友圈文案的博主。请根据以下旅行记录，写一段适合发社交媒体的文案。

地点：${selectedTrip.city}，${selectedTrip.country}
日期：${day.date} ${day.weekDay}
感言记录：${memos || '无文字记录，请根据地点发挥'}
照片数量：${(day.photos||[]).length}张

要求：
- 100-150字，轻松活泼有感染力
- 包含2-3个相关emoji
- 结尾加3-5个话题标签（如#京都旅行 #日本）
- 让人看了想去`;
    }

    const day = selectedDay;
    const memos = day.memos.map(m => `[${m.tag}] ${m.text}`).join('\n');
    return `你是一位擅长写旅行日记的作家。请根据以下记录，写一篇当天的旅行日记。

地点：${selectedTrip.city}，${selectedTrip.country}
日期：${day.date} ${day.weekDay}
照片数量：${(day.photos||[]).length}张
感言记录：
${memos || '无文字记录，请根据地点和日期发挥想象'}

要求：
- 第一人称，300-400字
- 有具体细节，有感受，有画面感
- 开头不要用"今天"，要有创意
- 结尾留有意境`;
  };

  const generate = async () => {
    if (mode === 'itinerary') {
      // if (!isPro) { openPaywall && openPaywall('AI路书生成'); return; } // TEST: 暂时跳过付费验证
      if (!itineraryDest.trim()) { Alert.alert('提示', '请输入目的地'); return; }
      setGenerating(true);
      setResult('');
      try {
        const prompt = `你是专业旅行规划师。请为去${itineraryDest}旅行${itineraryDays}天、风格偏好${itineraryStyle}的用户生成详细路书。
严格要求：
1. 只返回JSON，不要有任何前缀、后缀、解释或markdown代码块
2. 直接以{开头，以}结尾
3. 格式：{"title":"标题","days":[{"day":1,"date":"第1天","theme":"主题","morning":"上午行程","afternoon":"下午行程","evening":"晚上行程","tips":"小贴士"}]}
4. 每天行程简洁，景点+时间+交通，控制在50字以内
5. tips控制在30字以内
6. 确保JSON完整，不要截断`;
        const text = await callClaude(prompt, 3000);
        const clean = text.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(clean);
        // 格式化展示
        const formatted = parsed.days.map(d =>
          '📅 第' + d.day + '天 · ' + d.theme + '\n🌅 上午：' + d.morning + '\n☀️ 下午：' + d.afternoon + '\n🌙 晚上：' + d.evening + '\n💡 贴士：' + d.tips
        ).join('\n\n');
        setResult('🗺 ' + parsed.title + '\n\n' + formatted);
      } catch (e) {
        Alert.alert('生成失败', e.message || '请检查网络后重试');
      } finally {
        setGenerating(false);
      }
      return;
    }
    if (mode === 'packing') {
      if (!selectedTrip) { Alert.alert('Notice','Please select a trip first'); return; }
      setGenerating(true);
      setResult('');
      try {
        const text = await callClaude(buildPrompt(), 1200);
        // 解析 JSON 并存为打包清单
        const clean = text.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(clean);
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const STORAGE_KEY = '@wandernote_memos';
        const existing = await AsyncStorage.getItem(STORAGE_KEY);
        const memos = existing ? JSON.parse(existing) : [];
        const now = new Date();
        const timeStr = `${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')}`;
        const allItems = Object.entries(parsed.groups).flatMap(([groupName, list]) =>
          list.map((text, i) => ({ id: Date.now() + Math.random() * 1000 + i, text, checked: false, groupKey: groupName }))
        );
        const newMemo = {
          id: Date.now(),
          title: parsed.title || `${selectedTrip.city} Packing List`,
          items: allItems,
          category: 'packing',
          tripId: selectedTrip.id,
          createdAt: timeStr,
          updatedAt: timeStr,
        };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([newMemo, ...memos]));
        setResult('✅ Packing list generated and saved!\n\nGo to the Checklist tab to view your AI-generated packing list for ' + selectedTrip.city + '.');
      } catch (e) {
        Alert.alert('Generation Failed', e.message || 'Please check your network and try again');
      } finally {
        setGenerating(false);
      }
      return;
    }
    if (mode !== 'summary' && !selectedDay) { Alert.alert('Notice','Please select a day first'); return; }
    if (!selectedTrip) { Alert.alert('Notice','Please select a trip first'); return; }
    setGenerating(true);
    setResult('');
    try {
      const text = await callClaude(buildPrompt(), 1200);
      setResult(text);
    } catch (e) {
      Alert.alert('Generation Failed', e.message || 'Please check your network and try again');
    } finally {
      setGenerating(false);
    }
  };

  const shareResult = async () => {
    if (!result) return;
    await Share.share({ message: result });
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" />
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.header}>
          <Text style={s.title}>✦ AI 创作</Text>
          <Text style={s.subtitle}>让AI帮你记录旅行故事</Text>
        </View>

        <Text style={s.sectionTitle}>生成类型</Text>
        <View style={s.modeList}>
          {MODES.map(m=>(
            <TouchableOpacity key={m.key} style={[s.modeCard, mode===m.key&&s.modeCardActive]}
              onPress={()=>{setMode(m.key);setResult('');setSelectedDay(null);}}>
              <Text style={[s.modeLabel, mode===m.key&&{color:'#D4AF37'}]}>{m.label}</Text>
              <Text style={s.modeDesc}>{m.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 路书生成模式：显示专属输入区，隐藏旅程选择 */}
        {mode === 'itinerary' ? (
          <View style={{marginBottom:20}}>
            <Text style={s.sectionTitle}>目的地</Text>
            <TextInput
              style={{backgroundColor:'#161616',borderRadius:12,padding:14,color:'#F0EDE8',fontSize:15,marginBottom:12,borderWidth:1,borderColor:'#242424'}}
              placeholder="输入目的地（如：京都、冰岛、巴厘岛）"
              placeholderTextColor="#444"
              value={itineraryDest}
              onChangeText={setItineraryDest}
            />
            <Text style={s.sectionTitle}>天数</Text>
            <View style={{flexDirection:'row',gap:8,marginBottom:12}}>
              {['3','5','7','10','14'].map(d=>(
                <TouchableOpacity key={d}
                  style={{flex:1,padding:10,borderRadius:10,borderWidth:1,
                    borderColor:itineraryDays===d?'#D4AF37':'#242424',
                    backgroundColor:itineraryDays===d?'#D4AF3720':'#161616',
                    alignItems:'center'}}
                  onPress={()=>setItineraryDays(d)}>
                  <Text style={{color:itineraryDays===d?'#D4AF37':'#555',fontSize:14}}>{d}天</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={s.sectionTitle}>旅行风格</Text>
            <View style={{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:4}}>
              {['综合','文化历史','美食探索','自然户外','购物娱乐','轻松休闲'].map(style=>(
                <TouchableOpacity key={style}
                  style={{paddingHorizontal:14,paddingVertical:8,borderRadius:20,borderWidth:1,
                    borderColor:itineraryStyle===style?'#D4AF37':'#242424',
                    backgroundColor:itineraryStyle===style?'#D4AF3720':'#161616'}}
                  onPress={()=>setItineraryStyle(style)}>
                  <Text style={{color:itineraryStyle===style?'#D4AF37':'#555',fontSize:13}}>{style}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
        <>
        <Text style={s.sectionTitle}>选择旅程</Text>
        {trips.length===0 ? (
          <Text style={{color:'#555',fontSize:13,marginBottom:20}}>还没有旅程记录</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:20}}>
            <View style={{flexDirection:'row',gap:10}}>
              {trips.map(t=>(
                <TouchableOpacity key={t.id} style={[s.tripChip, selectedTrip?.id===t.id&&s.tripChipActive]}
                  onPress={()=>{setSelectedTrip(t);setSelectedDay(null);setResult('');}}>
                  <Text style={{fontSize:20,marginBottom:4}}>{t.emoji}</Text>
                  <Text style={[s.tripChipCity, selectedTrip?.id===t.id&&{color:'#D4AF37'}]}>{t.city}</Text>
                  <Text style={s.tripChipMeta}>{t.days.length}天</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}

        </>)}
        {mode !== 'itinerary' && selectedTrip && mode!=='summary' && (
          <>
            <Text style={s.sectionTitle}>选择哪一天</Text>
            {selectedTrip.days.length===0 ? (
              <Text style={{color:'#555',fontSize:13,marginBottom:20}}>这趟旅程还没有记录</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:20}}>
                <View style={{flexDirection:'row',gap:10}}>
                  {[...selectedTrip.days].sort((a,b)=>a.date.localeCompare(b.date)).map((d,i)=>(
                    <TouchableOpacity key={d.date} style={[s.dayChip, selectedDay?.date===d.date&&s.dayChipActive]}
                      onPress={()=>{setSelectedDay(d);setResult('');}}>
                      <Text style={[s.dayChipDay, selectedDay?.date===d.date&&{color:'#D4AF37'}]}>DAY {i+1}</Text>
                      <Text style={[s.dayChipDate, selectedDay?.date===d.date&&{color:'#D4AF37'}]}>{d.date.slice(5)}</Text>
                      <Text style={s.dayChipMeta}>
                        {d.memos.length>0?`📝${d.memos.length} `:''}{(d.photos||[]).length>0?`📸${d.photos.length}`:''}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}
          </>
        )}

        {(mode==='itinerary' || (selectedTrip && (mode==='summary' || selectedDay))) && (
          <TouchableOpacity style={[s.generateBtn, generating&&{opacity:0.7}]} onPress={generate} disabled={generating}>
            {generating ? (
              <View style={{flexDirection:'row',gap:10,alignItems:'center'}}>
                <ActivityIndicator color="#0D0D0D" size="small"/>
                <Text style={s.generateBtnText}>AI 正在创作中...</Text>
              </View>
            ) : (
              <Text style={s.generateBtnText}>✦ Generate</Text>
            )}
          </TouchableOpacity>
        )}

        {result !== '' && (
          <View style={s.resultCard}>
            <View style={s.resultHeader}>
              <Text style={s.resultTitle}>✦ Result</Text>
              <TouchableOpacity style={s.shareBtn} onPress={shareResult}>
                <Text style={s.shareBtnText}>Share →</Text>
              </TouchableOpacity>
            </View>
            <Text style={s.resultText}>{result}</Text>
            <TouchableOpacity style={s.regenerateBtn} onPress={generate}>
              <Text style={s.regenerateBtnText}>Regenerate</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:{flex:1,backgroundColor:'#0D0D0D'},
  scroll:{padding:24,paddingBottom:100},
  header:{marginBottom:24,marginTop:12},
  title:{fontSize:28,color:'#F0EDE8',fontWeight:'300'},
  subtitle:{fontSize:14,color:'#555',marginTop:4},
  sectionTitle:{fontSize:11,color:'#555',letterSpacing:3,textTransform:'uppercase',marginBottom:12},
  modeList:{gap:10,marginBottom:24},
  modeCard:{backgroundColor:'#161616',borderRadius:14,padding:16,borderWidth:1,borderColor:'#242424'},
  modeCardActive:{borderColor:'#D4AF37',backgroundColor:'#D4AF3710'},
  modeLabel:{fontSize:15,color:'#CCC',marginBottom:4},
  modeDesc:{fontSize:12,color:'#555'},
  tripChip:{backgroundColor:'#161616',borderRadius:14,padding:14,alignItems:'center',minWidth:100,maxWidth:130,borderWidth:1,borderColor:'#242424'},
  tripChipActive:{borderColor:'#D4AF37',backgroundColor:'#D4AF3710'},
  tripChipCity:{fontSize:12,color:'#888',marginBottom:2,textAlign:'center',flexWrap:'wrap'},
  tripChipMeta:{fontSize:11,color:'#555'},
  dayChip:{backgroundColor:'#161616',borderRadius:12,padding:12,alignItems:'center',width:76,borderWidth:1,borderColor:'#242424'},
  dayChipActive:{borderColor:'#D4AF37',backgroundColor:'#D4AF3710'},
  dayChipDay:{fontSize:10,color:'#555',letterSpacing:1},
  dayChipDate:{fontSize:13,color:'#888',marginTop:2},
  dayChipMeta:{fontSize:10,color:'#444',marginTop:4},
  generateBtn:{backgroundColor:'#D4AF37',borderRadius:14,padding:18,alignItems:'center',marginBottom:20},
  generateBtnText:{color:'#0D0D0D',fontSize:16,fontWeight:'700'},
  resultCard:{backgroundColor:'#161616',borderRadius:16,padding:20,borderWidth:1,borderColor:'#2A2A2A'},
  resultHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:16},
  resultTitle:{fontSize:13,color:'#D4AF37',letterSpacing:1},
  shareBtn:{backgroundColor:'#D4AF3720',borderWidth:1,borderColor:'#D4AF3750',borderRadius:20,paddingHorizontal:14,paddingVertical:6},
  shareBtnText:{color:'#D4AF37',fontSize:13},
  resultText:{fontSize:15,color:'#C8C4BC',lineHeight:26},
  regenerateBtn:{marginTop:16,padding:12,borderRadius:12,backgroundColor:'#1A1A1A',alignItems:'center'},
  regenerateBtnText:{color:'#666',fontSize:13},
});
