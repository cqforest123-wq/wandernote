import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View, TouchableOpacity, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default function YearReportScreen({ trips, navigation }) {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));

  const years = [...new Set(trips.map(t => t.date?.split('.')[0]).filter(Boolean))].sort((a,b)=>b-a);
  if (!years.includes(String(now.getFullYear()))) years.unshift(String(now.getFullYear()));

  const yearTrips = trips.filter(t => t.date?.startsWith(selectedYear));
  const allDays = yearTrips.flatMap(t => t.days);
  const allMemos = allDays.flatMap(d => d.memos);
  const allPhotos = allDays.flatMap(d => d.photos || []);
  const allVideos = allDays.flatMap(d => d.videos || []);

  // 国家统计
  const countries = [...new Set(yearTrips.map(t => t.country).filter(Boolean))];

  // 标签统计
  const tagCount = {};
  allMemos.forEach(m => { tagCount[m.tag] = (tagCount[m.tag]||0)+1; });
  const topTags = Object.entries(tagCount).sort((a,b)=>b[1]-a[1]).slice(0,5);

  // 月份分布
  const monthCount = {};
  yearTrips.forEach(t => {
    const month = t.date?.split('.')[1];
    if (month) monthCount[parseInt(month)] = (monthCount[parseInt(month)]||0)+1;
  });

  // 最活跃月份
  const busyMonth = Object.entries(monthCount).sort((a,b)=>b[1]-a[1])[0];

  const TAG_COLORS = {'美食':'#FF8C69','风景':'#6BCB77','邂逅':'#9B8EC4','探险':'#5BC0BE','住宿':'#FFB347','交通':'#64B5F6','购物':'#F06292','感言':'#A8D8EA'};

  const MONTH_NAMES = ['','1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D0D"/>
      <ScrollView contentContainerStyle={s.scroll}>

        {/* 顶部 */}
        <View style={s.header}>
          <TouchableOpacity onPress={()=>navigation.goBack()}>
            <Text style={s.back}>← 返回</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>年度旅行报告</Text>
          <View style={{width:40}}/>
        </View>

        {/* 年份切换 */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:24}}>
          <View style={{flexDirection:'row',gap:10,paddingHorizontal:24}}>
            {years.map(y=>(
              <TouchableOpacity key={y}
                style={[s.yearBtn, selectedYear===y && s.yearBtnActive]}
                onPress={()=>setSelectedYear(y)}>
                <Text style={[s.yearBtnText, selectedYear===y && s.yearBtnTextActive]}>{y}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* 主标题卡片 */}
        <View style={s.heroCard}>
          <Text style={s.heroYear}>{selectedYear}</Text>
          <Text style={s.heroTitle}>你的旅行年度总结</Text>
          <View style={s.heroDivider}/>
          <Text style={s.heroDesc}>
            {yearTrips.length > 0
              ? `这一年你去了 ${countries.length} 个国家，${yearTrips.length} 段旅程，留下了 ${allMemos.length} 条旅行感言`
              : '这一年还没有旅行记录，出发吧！🌍'}
          </Text>
        </View>

        {/* 核心数据 */}
        <View style={s.statsGrid}>
          {[
            {num: yearTrips.length, label: '段旅程', emoji: '✈️'},
            {num: countries.length, label: '个国家', emoji: '🌍'},
            {num: allDays.length, label: '天在路上', emoji: '📅'},
            {num: allMemos.length, label: '条感言', emoji: '📝'},
            {num: allPhotos.length, label: '张照片', emoji: '📸'},
            {num: allVideos.length, label: '段视频', emoji: '🎬'},
          ].map(item=>(
            <View key={item.label} style={s.statCard}>
              <Text style={s.statEmoji}>{item.emoji}</Text>
              <Text style={s.statNum}>{item.num}</Text>
              <Text style={s.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* 去过的国家 */}
        {countries.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>🌍 去过的国家/地区</Text>
            <View style={s.tagWrap}>
              {countries.map(c=>(
                <View key={c} style={s.countryTag}>
                  <Text style={s.countryTagText}>{c}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 旅程列表 */}
        {yearTrips.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>✈️ 本年旅程</Text>
            {yearTrips.map(t=>(
              <View key={t.id} style={s.tripRow}>
                <Text style={s.tripRowEmoji}>{t.emoji}</Text>
                <View style={{flex:1}}>
                  <Text style={s.tripRowCity}>{t.city}</Text>
                  <Text style={s.tripRowMeta}>{t.country} · {t.days.length}天 · {t.days.reduce((a,d)=>a+d.memos.length,0)}条感言</Text>
                </View>
                <Text style={s.tripRowDate}>{t.date}</Text>
              </View>
            ))}
          </View>
        )}

        {/* 月份热力图 */}
        {Object.keys(monthCount).length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>📅 出行月份分布</Text>
            <View style={s.monthGrid}>
              {Array.from({length:12},(_,i)=>i+1).map(m=>{
                const count = monthCount[m] || 0;
                const maxCount = Math.max(...Object.values(monthCount), 1);
                const opacity = count > 0 ? 0.3 + (count/maxCount)*0.7 : 0.08;
                return (
                  <View key={m} style={s.monthCell}>
                    <View style={[s.monthBar, {backgroundColor:`rgba(212,175,55,${opacity})`, height: Math.max(8, count/maxCount*60)}]}/>
                    <Text style={s.monthLabel}>{MONTH_NAMES[m]}</Text>
                    {count > 0 && <Text style={s.monthCount}>{count}</Text>}
                  </View>
                );
              })}
            </View>
            {busyMonth && (
              <Text style={s.busyMonthText}>
                🏆 最爱出行月份：{MONTH_NAMES[parseInt(busyMonth[0])]}
              </Text>
            )}
          </View>
        )}

        {/* 感言标签分析 */}
        {topTags.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>🏷 感言标签分析</Text>
            {topTags.map(([tag, count], i)=>{
              const maxCount = topTags[0][1];
              const color = TAG_COLORS[tag] || '#D4AF37';
              return (
                <View key={tag} style={s.tagRow}>
                  <Text style={s.tagRank}>#{i+1}</Text>
                  <View style={[s.tagDot,{backgroundColor:color}]}/>
                  <Text style={[s.tagName,{color}]}>{tag}</Text>
                  <View style={s.tagBarBg}>
                    <View style={[s.tagBar,{width:`${count/maxCount*100}%`,backgroundColor:color}]}/>
                  </View>
                  <Text style={s.tagCount}>{count}条</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* 年度寄语 */}
        <View style={s.quoteCard}>
          <Text style={s.quoteText}>
            {yearTrips.length === 0
              ? '"世界那么大，出发吧 🌍"'
              : yearTrips.length <= 2
              ? '"每一次出发，都是一次新生 ✨"'
              : yearTrips.length <= 5
              ? '"旅行是最好的教育，你已经很棒了 🌟"'
              : '"你是真正的旅行家，脚步从未停歇 🚀"'}
          </Text>
          <Text style={s.quoteYear}>— {selectedYear} 年度旅行报告</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:{flex:1,backgroundColor:'#0D0D0D'},
  scroll:{paddingBottom:60},
  header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:24,paddingBottom:16},
  back:{color:'#D4AF37',fontSize:15},
  headerTitle:{fontSize:17,color:'#F0EDE8',fontWeight:'300'},
  yearBtn:{paddingHorizontal:20,paddingVertical:10,borderRadius:20,backgroundColor:'#161616',borderWidth:1,borderColor:'#242424'},
  yearBtnActive:{backgroundColor:'#D4AF3720',borderColor:'#D4AF37'},
  yearBtnText:{fontSize:15,color:'#555'},
  yearBtnTextActive:{color:'#D4AF37'},
  heroCard:{margin:24,marginTop:0,backgroundColor:'#161616',borderRadius:20,padding:24,borderWidth:1,borderColor:'#242424',alignItems:'center'},
  heroYear:{fontSize:56,color:'#D4AF37',fontWeight:'200',lineHeight:60},
  heroTitle:{fontSize:18,color:'#F0EDE8',fontWeight:'300',marginTop:8},
  heroDivider:{width:40,height:1,backgroundColor:'#D4AF3760',marginVertical:16},
  heroDesc:{fontSize:14,color:'#888',textAlign:'center',lineHeight:22},
  statsGrid:{flexDirection:'row',flexWrap:'wrap',gap:10,paddingHorizontal:24,marginBottom:8},
  statCard:{width:(width-58)/3,backgroundColor:'#161616',borderRadius:14,padding:14,alignItems:'center',borderWidth:1,borderColor:'#242424'},
  statEmoji:{fontSize:22,marginBottom:6},
  statNum:{fontSize:24,color:'#D4AF37',fontWeight:'300'},
  statLabel:{fontSize:11,color:'#555',marginTop:4,textAlign:'center'},
  section:{margin:24,marginTop:16},
  sectionTitle:{fontSize:11,color:'#555',letterSpacing:3,textTransform:'uppercase',marginBottom:14},
  tagWrap:{flexDirection:'row',flexWrap:'wrap',gap:8},
  countryTag:{backgroundColor:'#D4AF3715',borderWidth:1,borderColor:'#D4AF3740',borderRadius:20,paddingHorizontal:14,paddingVertical:7},
  countryTagText:{color:'#D4AF37',fontSize:13},
  tripRow:{flexDirection:'row',alignItems:'center',gap:12,backgroundColor:'#161616',borderRadius:12,padding:14,marginBottom:8,borderWidth:1,borderColor:'#242424'},
  tripRowEmoji:{fontSize:28},
  tripRowCity:{fontSize:15,color:'#F0EDE8'},
  tripRowMeta:{fontSize:12,color:'#555',marginTop:3},
  tripRowDate:{fontSize:11,color:'#444'},
  monthGrid:{flexDirection:'row',alignItems:'flex-end',gap:4,height:90,marginBottom:12},
  monthCell:{flex:1,alignItems:'center',justifyContent:'flex-end'},
  monthBar:{width:'100%',borderRadius:3,minHeight:8},
  monthLabel:{fontSize:9,color:'#444',marginTop:4},
  monthCount:{fontSize:9,color:'#D4AF37',marginTop:2},
  busyMonthText:{color:'#D4AF37',fontSize:13,textAlign:'center',marginTop:8},
  tagRow:{flexDirection:'row',alignItems:'center',gap:10,marginBottom:12},
  tagRank:{fontSize:12,color:'#444',width:24},
  tagDot:{width:8,height:8,borderRadius:4},
  tagName:{fontSize:13,width:40},
  tagBarBg:{flex:1,height:6,backgroundColor:'#1A1A1A',borderRadius:3,overflow:'hidden'},
  tagBar:{height:6,borderRadius:3},
  tagCount:{fontSize:12,color:'#555',width:32,textAlign:'right'},
  quoteCard:{margin:24,marginTop:8,backgroundColor:'#0D1A0D',borderWidth:1,borderColor:'#2D6A4F40',borderRadius:20,padding:24,alignItems:'center'},
  quoteText:{fontSize:16,color:'#F0EDE8',textAlign:'center',lineHeight:26,fontStyle:'italic'},
  quoteYear:{fontSize:12,color:'#555',marginTop:12},
});
