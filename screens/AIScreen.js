import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Alert, Share } from 'react-native';
import { callClaude } from '../lib/claude';

export default function AIScreen({ trips }) {
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState('');
  const [mode, setMode] = useState('diary');

  const MODES = [
    { key:'diary', label:'📖 旅行日记', desc:'完整叙事风格，适合珍藏' },
    { key:'social', label:'📱 社交文案', desc:'适合发朋友圈/小红书' },
    { key:'summary', label:'✨ 旅程总结', desc:'整趟旅程的精华回顾' },
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
    if (mode !== 'summary' && !selectedDay) { Alert.alert('提示','请先选择要生成的那一天'); return; }
    if (!selectedTrip) { Alert.alert('提示','请先选择旅程'); return; }
    setGenerating(true);
    setResult('');
    try {
      const text = await callClaude(buildPrompt(), 1200);
      setResult(text);
    } catch (e) {
      Alert.alert('生成失败', e.message || '请检查网络后重试');
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

        {selectedTrip && mode!=='summary' && (
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

        {selectedTrip && (mode==='summary' || selectedDay) && (
          <TouchableOpacity style={[s.generateBtn, generating&&{opacity:0.7}]} onPress={generate} disabled={generating}>
            {generating ? (
              <View style={{flexDirection:'row',gap:10,alignItems:'center'}}>
                <ActivityIndicator color="#0D0D0D" size="small"/>
                <Text style={s.generateBtnText}>AI 正在创作中...</Text>
              </View>
            ) : (
              <Text style={s.generateBtnText}>✦ 开始生成</Text>
            )}
          </TouchableOpacity>
        )}

        {result !== '' && (
          <View style={s.resultCard}>
            <View style={s.resultHeader}>
              <Text style={s.resultTitle}>✦ 生成结果</Text>
              <TouchableOpacity style={s.shareBtn} onPress={shareResult}>
                <Text style={s.shareBtnText}>分享 →</Text>
              </TouchableOpacity>
            </View>
            <Text style={s.resultText}>{result}</Text>
            <TouchableOpacity style={s.regenerateBtn} onPress={generate}>
              <Text style={s.regenerateBtnText}>重新生成</Text>
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
