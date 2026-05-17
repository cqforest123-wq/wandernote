import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator, Alert, Share, Keyboard, KeyboardAvoidingView, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Clipboard from 'expo-clipboard';

const ITINERARY_STYLES = [
  { key: 'balanced', labelKey: 'ai_style_balanced' },
  { key: 'culture', labelKey: 'ai_style_culture' },
  { key: 'food', labelKey: 'ai_style_food' },
  { key: 'nature', labelKey: 'ai_style_nature' },
  { key: 'shopping', labelKey: 'ai_style_shopping' },
  { key: 'relax', labelKey: 'ai_style_relax' },
];


function parseAiJsonObject(text) {
  const clean = String(text || '').replace(/```json|```/g, '').trim();
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');

  if (start < 0 || end <= start) {
    throw new Error('AI did not return valid JSON.');
  }

  return JSON.parse(clean.slice(start, end + 1));
}

function getAiOutputLanguage(lang) {
  const code = String(lang || 'en').split('-')[0];
  const map = {
    zh: 'Chinese',
    en: 'English',
    ja: 'Japanese',
    ko: 'Korean',
    fr: 'French',
    es: 'Spanish',
    th: 'Thai',
  };
  return map[code] || 'English';
}

import { callClaude } from '../lib/claude';
import { requestDomesticAiItineraryAccess } from '../lib/domesticAiAccess';

export default function AIScreen({ trips, isPro, openPaywall }) {
  const { t, i18n } = useTranslation();
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState('');
  const [itineraryDest, setItineraryDest] = useState('');
  const [itineraryDays, setItineraryDays] = useState('5');
  const [itineraryStyle, setItineraryStyle] = useState('balanced');
  const aiOutputLanguage = getAiOutputLanguage(i18n.language);
  const daysUnit = t('unit_days');
  const [mode, setMode] = useState('diary');

  const MODES = [
    { key:'diary', label:t('ai_diary'), desc:t('ai_diary_desc') },
    { key:'social', label:t('ai_social'), desc:t('ai_social_desc') },
    { key:'summary', label:t('ai_summary'), desc:t('ai_summary_desc') },
    { key:'itinerary', label:t('ai_itinerary'), desc:t('ai_itinerary_desc') },
  ];

  const buildPrompt = () => {
    if (mode === 'summary') {
      const trip = selectedTrip;
      const allMemos = trip.days.flatMap(d => d.memos.map(m => `[${d.date} ${m.tag}] ${m.text}`));
      return `You are a skilled travel writer. Based on the following travel records, write a complete trip summary article.
Output language: ${aiOutputLanguage}.

Destination: ${trip.city}, ${trip.country}
Trip date: ${trip.date}
Duration: ${trip.days.length} days, ${allMemos.length} notes

Travel notes:
${allMemos.length > 0 ? allMemos.join('\n') : 'No written notes. Infer cautiously from the destination and dates.'}

Requirements:
- Use first-person voice.
- Make it authentic, specific, and emotionally grounded.
- Structure: opening → trip highlights → reflective ending.
- Include vivid details and a sense of place.
- Avoid overpromising facts that are not in the record.`;
    }

    if (mode === 'social') {
      const day = selectedDay;
      const memos = day.memos.map(m => m.text).join('；');
      return `You are a travel social media copywriter. Based on the following travel record, write a short post suitable for Instagram, TikTok, or social sharing.
Output language: ${aiOutputLanguage}.

Destination: ${selectedTrip.city}, ${selectedTrip.country}
Date: ${day.date} ${day.weekDay}
Notes: ${memos || 'No written notes. Infer cautiously from the destination.'}
Photo count: ${(day.photos||[]).length}

Requirements:
- 100-150 words.
- Light, vivid, and shareable.
- Include 2-3 relevant emoji.
- End with 3-5 relevant hashtags.
- Do not invent specific facts unless clearly implied.`;
    }

    const day = selectedDay;
    const memos = day.memos.map(m => `[${m.tag}] ${m.text}`).join('\n');
    return `You are a travel diary writer. Based on the following record, write a diary entry for this day.
Output language: ${aiOutputLanguage}.

Destination: ${selectedTrip.city}, ${selectedTrip.country}
Date: ${day.date} ${day.weekDay}
Photo count: ${(day.photos||[]).length}
Notes:
${memos || 'No written notes. Infer cautiously from the destination and date.'}

Requirements:
- First-person voice.
- 300-400 words.
- Include concrete details, feelings, and visual scenes.
- Avoid starting with a generic phrase like “Today”.
- End with a reflective tone.`;
  };

  const generate = async () => {
    if (mode === 'itinerary') {
      // if (!isPro) { openPaywall && openPaywall('AI路书生成'); return; } // TEST: 暂时跳过付费验证
      if (!itineraryDest.trim()) { Alert.alert(t('ai_alert_title'), t('ai_enter_destination')); return; }

      const access = await requestDomesticAiItineraryAccess();
      if (!access.allowed) {
        Alert.alert('今日次数已用完', '今日 AI 路书生成次数已用完，请明天再试。');
        return;
      }

      if (access.source === 'rewarded_ad') {
        Alert.alert('已通过激励广告解锁', '模拟广告已完成，本次 AI 路书生成已解锁。');
      }

      setGenerating(true);
      setResult('');
      try {
        const prompt = `You are a professional travel planner. Create a detailed ${itineraryDays}-day itinerary for ${itineraryDest}.
Travel style: ${t(`ai_style_${itineraryStyle}`)}.
Output language for all JSON values: ${aiOutputLanguage}.

Strict requirements:
1. Return JSON only. No prefix, suffix, explanation, or markdown code block.
2. Start directly with { and end directly with }.
3. Format: {"title":"Title","days":[{"day":1,"date":"Day 1","theme":"Theme","morning":"Morning plan","afternoon":"Afternoon plan","evening":"Evening plan","tips":"Practical tips","distance":"Approximate distance between places","hours":"Suggested visit duration","status":"Opening-status reminder"}]}
4. Keep each day concise: attractions + time + transport.
5. tips must be practical. distance should be approximate. hours should be suggested visit duration. status should be a cautious operating-hours reminder.
6. Keep each field short and ensure valid complete JSON.`;
        const text = await callClaude(prompt, 8000, {
          responseMimeType: 'application/json',
          region: 'cn',
          task: 'itinerary',
        });
        const clean = text.replace(/```json|```/g, '').trim().replace(/\n/g, ' ');
        const parsed = parseAiJsonObject(text);
        // 格式化展示
        const disclaimer = t('ai_disclaimer');
        const formatted = parsed.days.map(d => {
          let dayText = t('ai_day_number').replace('%d', d.day) + ' · ' + d.theme +
            '\n🌅 ' + t('ai_morning') + ': ' + d.morning +
            '\n☀️ ' + t('ai_afternoon') + ': ' + d.afternoon +
            '\n🌙 ' + t('ai_evening') + ': ' + d.evening;
          if (d.distance) dayText += '\n📍 ' + t('ai_distance') + ': ' + d.distance;
          if (d.hours) dayText += '\n⏱ ' + t('ai_duration') + ': ' + d.hours;
          if (d.status) dayText += '\n🏪 ' + t('ai_opening_status') + ': ' + d.status;
          dayText += '\n💡 ' + t('ai_tips') + ': ' + d.tips;
          return dayText;
        }).join('\n\n');
        setResult('🗺 ' + parsed.title + '\n\n' + disclaimer + '\n\n' + formatted);
      } catch (e) {
        Alert.alert(t('ai_generate_failed'), e.message || t('ai_network_retry'));
      } finally {
        setGenerating(false);
      }
      return;
    }
    if (!selectedTrip) {
      Alert.alert(t('ai_notice'), t('ai_select_trip_first'));
      return;
    }

    if (mode !== 'summary' && !selectedDay) {
      Alert.alert(t('ai_notice'), t('ai_select_day_first'));
      return;
    }
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

  const copyResult = async () => {
    if (!result) return;
    await Clipboard.setStringAsync(result);
    Alert.alert(t('ai_notice'), t('ai_copied'));
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View style={s.header}>
          <Text style={s.title}>✦ {t('ai_title')}</Text>
          <Text style={s.subtitle}>{t('ai_subtitle')}</Text>
        </View>

        <Text style={s.sectionTitle}>{t('ai_generation_type')}</Text>
        <View style={s.modeList}>
          {MODES.map(m=>(
            <TouchableOpacity key={m.key} style={[s.modeCard, mode===m.key&&s.modeCardActive]}
              onPress={()=>{
                if (m.key !== 'itinerary') {
                  if (trips.length === 0) {
                    Alert.alert(t('ai_notice'), t('ai_create_trip_first'));
                  } else if (!selectedTrip) {
                    Alert.alert(t('ai_notice'), t('ai_select_trip_first'));
                  } else if (m.key !== 'summary' && !selectedDay) {
                    Alert.alert(t('ai_notice'), t('ai_select_day_first'));
                  }
                }
                setMode(m.key);
                setResult('');
                if (m.key === 'summary' || m.key === 'itinerary') {
                  setSelectedDay(null);
                }
              }}>
              <Text style={[s.modeLabel, mode===m.key&&{color:'#D4AF37'}]}>{m.label}</Text>
              <Text style={s.modeDesc}>{m.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 路书生成模式：显示专属输入区，隐藏旅程选择 */}
        {mode === 'itinerary' ? (
          <View style={{marginBottom:20}}>
            <Text style={s.sectionTitle}>{t('ai_destination')}</Text>
            <TextInput
              style={{backgroundColor:'#161616',borderRadius:12,padding:14,color:'#F0EDE8',fontSize:15,marginBottom:12,borderWidth:1,borderColor:'#242424'}}
              placeholder={t("ai_destination_placeholder")}
              placeholderTextColor="#444"
              value={itineraryDest}
              onChangeText={setItineraryDest}
            />
            <Text style={s.sectionTitle}>{t('ai_days')}</Text>
            <View style={{flexDirection:'row',gap:8,marginBottom:12}}>
              {['3','5','7','10','14'].map(d=>(
                <TouchableOpacity key={d}
                  style={{flex:1,padding:10,borderRadius:10,borderWidth:1,
                    borderColor:itineraryDays===d?'#D4AF37':'#242424',
                    backgroundColor:itineraryDays===d?'#D4AF3720':'#161616',
                    alignItems:'center'}}
                  onPress={()=>setItineraryDays(d)}>
                  <Text style={{color:itineraryDays===d?'#D4AF37':'#555',fontSize:14}}>{d} {daysUnit}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={s.sectionTitle}>{t('ai_travel_style')}</Text>
            <View style={{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:4}}>
              {ITINERARY_STYLES.map(style=>(
                <TouchableOpacity key={style.key}
                  style={{paddingHorizontal:14,paddingVertical:8,borderRadius:20,borderWidth:1,
                    borderColor:itineraryStyle===style.key?'#D4AF37':'#242424',
                    backgroundColor:itineraryStyle===style.key?'#D4AF3720':'#161616'}}
                  onPress={()=>setItineraryStyle(style.key)}>
                  <Text style={{color:itineraryStyle===style.key?'#D4AF37':'#555',fontSize:13}}>{t(style.labelKey)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
        <>
        <Text style={s.sectionTitle}>{t('ai_select_trip')}</Text>
        {trips.length===0 ? (
          <Text style={{color:'#555',fontSize:13,marginBottom:20}}>{t('ai_no_trips')}</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:20}}>
            <View style={{flexDirection:'row',gap:10}}>
              {trips.map(t=>(
                <TouchableOpacity key={t.id} style={[s.tripChip, selectedTrip?.id===t.id&&s.tripChipActive]}
                  onPress={()=>{setSelectedTrip(t);setSelectedDay(null);setResult('');}}>
                  <Text style={{fontSize:20,marginBottom:4}}>{t.emoji}</Text>
                  <Text style={[s.tripChipCity, selectedTrip?.id===t.id&&{color:'#D4AF37'}]}>{t.city}</Text>
                  <Text style={s.tripChipMeta}>{t.days.length} {daysUnit}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}

        </>)}
        {mode !== 'itinerary' && selectedTrip && mode!=='summary' && (
          <>
            <Text style={s.sectionTitle}>{t('ai_select_day')}</Text>
            {selectedTrip.days.length===0 ? (
              <Text style={{color:'#555',fontSize:13,marginBottom:20}}>{t('ai_no_day_records')}</Text>
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
          <TouchableOpacity style={[s.generateBtn, generating&&{opacity:0.7}]} onPress={()=>{Keyboard.dismiss();generate();}} disabled={generating}>
            {generating ? (
              <View style={{flexDirection:'row',gap:10,alignItems:'center'}}>
                <ActivityIndicator color="#0D0D0D" size="small"/>
                <Text style={s.generateBtnText}>{t('ai_generating')}</Text>
              </View>
            ) : (
              <Text style={s.generateBtnText}>✦ {t('ai_generate_action')}</Text>
            )}
          </TouchableOpacity>
        )}

        {result !== '' && (
          <View style={s.resultCard}>
            <View style={s.resultHeader}>
              <Text style={s.resultTitle}>✦ {t('ai_result')}</Text>
              <View style={{flexDirection:'row',gap:8}}>
                <TouchableOpacity style={s.shareBtn} onPress={copyResult}>
                  <Text style={s.shareBtnText}>{t('copy')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.shareBtn} onPress={shareResult}>
                  <Text style={s.shareBtnText}>{t('ai_share')} →</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text style={s.resultText}>{result}</Text>
            <TouchableOpacity style={s.regenerateBtn} onPress={generate}>
              <Text style={s.regenerateBtnText}>{t('ai_regenerate')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      </KeyboardAvoidingView>
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
