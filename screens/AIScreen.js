import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator, Alert, Share, Keyboard, KeyboardAvoidingView, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Clipboard from 'expo-clipboard';
import {
  buildLocalItinerary,
  buildLocalTravelStory,
} from '../lib/travelStoryFallback';

const ITINERARY_STYLES = [
  { key: 'balanced', labelKey: 'ai_style_balanced' },
  { key: 'culture', labelKey: 'ai_style_culture' },
  { key: 'food', labelKey: 'ai_style_food' },
  { key: 'nature', labelKey: 'ai_style_nature' },
  { key: 'shopping', labelKey: 'ai_style_shopping' },
  { key: 'relax', labelKey: 'ai_style_relax' },
];


export default function AIScreen({ trips }) {
  const { t } = useTranslation();
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState('');
  const [itineraryDest, setItineraryDest] = useState('');
  const [itineraryDays, setItineraryDays] = useState('5');
  const [itineraryStyle, setItineraryStyle] = useState('balanced');
  const daysUnit = t('unit_days');
  const [mode, setMode] = useState('diary');

  const MODES = [
    { key:'diary', label:t('ai_diary'), desc:t('ai_diary_desc') },
    { key:'social', label:t('ai_social'), desc:t('ai_social_desc') },
    { key:'summary', label:t('ai_summary'), desc:t('ai_summary_desc') },
    { key:'itinerary', label:t('ai_itinerary'), desc:t('ai_itinerary_desc') },
  ];

  const generate = () => {
    setGenerating(true);
    setResult('');
    try {
      const draft = mode === 'itinerary'
        ? buildLocalItinerary({
            destination: itineraryDest,
            days: itineraryDays,
            style: t(`ai_style_${itineraryStyle}`),
          })
        : buildLocalTravelStory({
            mode,
            trip: selectedTrip,
            day: mode === 'summary' ? null : selectedDay,
          });
      setResult(draft);
    } catch (e) {
      setResult(buildLocalTravelStory());
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
