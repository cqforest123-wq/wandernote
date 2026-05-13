import React, { useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { deleteTripAndRelated } from '../lib/sync';
import { useTranslation } from 'react-i18next';
import { getCityCoords } from '../lib/cityCoords';
import { fetchWeatherForecast, getWeatherInfo, formatTemp } from '../lib/weather';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, Modal, KeyboardAvoidingView, Platform, Alert } from 'react-native';

const CONTINENTS = [
  { name:'🌏 亚洲', countries:[
    {name:'阿富汗',cities:['喀布尔','班达米尔湖','巴米扬']},
    {name:'阿联酋',cities:['迪拜','阿布扎比','沙迦']},
    {name:'阿曼',cities:['马斯喀特','尼兹瓦','瓦希巴沙漠','沙拉拉']},
    {name:'阿塞拜疆',cities:['巴库','舍基','加巴拉']},
    {name:'澳门',cities:['澳门半岛','氹仔','路环']},
    {name:'巴基斯坦',cities:['拉合尔','卡拉奇','伊斯兰堡','洪扎谷地']},
    {name:'巴林',cities:['麦纳麦']},
    {name:'不丹',cities:['廷布','帕罗','普纳卡','虎穴寺']},
    {name:'朝鲜',cities:['平壤']},
    {name:'东帝汶',cities:['帝力']},
    {name:'菲律宾',cities:['巴拉望岛','宿务','博霍尔','长滩岛','马尼拉']},
    {name:'格鲁吉亚',cities:['第比利斯','卡兹别吉','库塔伊西','巴统']},
    {name:'哈萨克斯坦',cities:['阿拉木图','阿斯塔纳','奇姆肯特']},
    {name:'韩国',cities:['首尔','釜山','济州岛','庆州','全州','仁川']},
    {name:'吉尔吉斯斯坦',cities:['比什凯克','伊塞克湖','奥什']},
    {name:'柬埔寨',cities:['吴哥窟/暹粒','金边','西哈努克']},
    {name:'卡塔尔',cities:['多哈']},
    {name:'科威特',cities:['科威特城']},
    {name:'老挝',cities:['琅勃拉邦','万象','万荣','4000岛']},
    {name:'黎巴嫩',cities:['贝鲁特','拜布洛斯','巴勒贝克']},
    {name:'马尔代夫',cities:['马累','北马累环礁','南马累环礁','阿里环礁']},
    {name:'马来西亚',cities:['吉隆坡','槟城','马六甲','沙巴','兰卡威']},
    {name:'孟加拉国',cities:['达卡','吉大港','孙德尔本斯']},
    {name:'缅甸',cities:['蒲甘','仰光','曼德勒','茵莱湖']},
    {name:'蒙古',cities:['乌兰巴托','戈壁沙漠','库苏古尔湖']},
    {name:'尼泊尔',cities:['加德满都','博卡拉','奇特旺','珠峰大本营']},
    {name:'日本',cities:['东京','京都','大阪','奈良','镰仓','箱根','北海道','冲绳','广岛','神户','长崎','福冈','金泽','高山','白川乡']},
    {name:'沙特阿拉伯',cities:['利雅得','吉达','阿尔乌拉']},
    {name:'斯里兰卡',cities:['科伦坡','锡吉里亚','康提','加勒']},
    {name:'台湾',cities:['台北','台南','台中','花莲','垦丁','九份','日月潭','阿里山']},
    {name:'塔吉克斯坦',cities:['杜尚别','帕米尔高原']},
    {name:'泰国',cities:['清迈','曼谷','普吉岛','苏梅岛','清莱','大城','华欣','喀比']},
    {name:'土库曼斯坦',cities:['阿什哈巴德','地狱之门/达瓦扎']},
    {name:'土耳其',cities:['伊斯坦布尔','卡帕多奇亚','棉花堡','以弗所','博德鲁姆','安塔利亚']},
    {name:'文莱',cities:['斯里巴加湾市']},
    {name:'乌兹别克斯坦',cities:['撒马尔罕','布哈拉','希瓦','塔什干']},
    {name:'香港',cities:['香港岛','九龙','大屿山','离岛','麦理浩径','西贡']},
    {name:'新加坡',cities:['新加坡']},
    {name:'叙利亚',cities:['大马士革','阿勒颇','帕尔米拉']},
    {name:'亚美尼亚',cities:['埃里温','格加尔德','迪利然','塞凡湖']},
    {name:'也门',cities:['索科特拉岛','萨那']},
    {name:'伊朗',cities:['设拉子','伊斯法罕','德黑兰','亚兹德']},
    {name:'以色列',cities:['耶路撒冷','特拉维夫','死海','海法']},
    {name:'印度',cities:['泰姬陵/阿格拉','斋浦尔','瓦拉纳西','果阿','喀拉拉邦','拉达克','德里','孟买','清奈']},
    {name:'印度尼西亚',cities:['巴厘岛','日惹','科莫多岛','龙目岛','雅加达']},
    {name:'约旦',cities:['佩特拉','瓦迪拉姆','亚喀巴','死海','安曼']},
    {name:'越南',cities:['河内','胡志明市','会安','下龙湾','芽庄','富国岛','大叻','顺化','岘港']},
    {name:'中国',cities:['北京','上海','成都','西安','丽江','黄山','桂林','拉萨','敦煌','厦门','重庆','杭州','苏州','青岛','张家界','三亚','大理']},
  ]},
  { name:'🌍 欧洲', countries:[
    {name:'阿尔巴尼亚',cities:['地拉那','培拉特','吉诺卡斯特','萨兰达']},
    {name:'安道尔',cities:['安道尔城']},
    {name:'奥地利',cities:['维也纳','萨尔茨堡','哈尔施塔特','因斯布鲁克']},
    {name:'白俄罗斯',cities:['明斯克','布列斯特']},
    {name:'保加利亚',cities:['索非亚','普罗夫迪夫','大特尔诺沃','里拉修道院']},
    {name:'比利时',cities:['布鲁日','布鲁塞尔','根特','安特卫普']},
    {name:'波黑',cities:['萨拉热窝','莫斯塔尔']},
    {name:'波兰',cities:['克拉科夫','华沙','弗罗茨瓦夫','格但斯克','扎科帕内']},
    {name:'丹麦',cities:['哥本哈根','奥胡斯','法罗群岛','博恩霍尔姆岛']},
    {name:'德国',cities:['慕尼黑','柏林','海德堡','新天鹅堡','科隆','汉堡','罗腾堡','德累斯顿']},
    {name:'俄罗斯',cities:['莫斯科','圣彼得堡','贝加尔湖','堪察加','索契']},
    {name:'法国',cities:['巴黎','尼斯','里昂','波尔多','马赛','斯特拉斯堡','普罗旺斯','科西嘉岛']},
    {name:'芬兰',cities:['赫尔辛基','罗瓦涅米/圣诞老人村','图尔库','坦佩雷']},
    {name:'荷兰',cities:['阿姆斯特丹','鹿特丹','海牙','代尔夫特','羊角村']},
    {name:'黑山',cities:['科托尔','波德戈里察','布德瓦']},
    {name:'捷克',cities:['布拉格','克鲁姆洛夫','卡罗维发利','布尔诺']},
    {name:'克罗地亚',cities:['杜布罗夫尼克','斯普利特','普利特维采','赫瓦尔岛','扎达尔']},
    {name:'科索沃',cities:['普里什蒂纳','普里兹伦']},
    {name:'拉脱维亚',cities:['里加','尤尔马拉','锡古尔达']},
    {name:'列支敦士登',cities:['瓦杜兹']},
    {name:'立陶宛',cities:['维尔纽斯','考纳斯','克莱佩达']},
    {name:'卢森堡',cities:['卢森堡城','维安登']},
    {name:'罗马尼亚',cities:['布拉索夫','布加勒斯特','锡比乌','多瑙河三角洲']},
    {name:'马耳他',cities:['瓦莱塔','戈佐岛']},
    {name:'摩尔多瓦',cities:['基希讷乌']},
    {name:'摩纳哥',cities:['摩纳哥城']},
    {name:'挪威',cities:['奥斯陆','卑尔根','盖朗厄尔峡湾','罗弗敦群岛','特罗姆瑟','弗洛姆']},
    {name:'葡萄牙',cities:['里斯本','波尔图','辛特拉','阿尔加维','马德拉岛','亚速尔群岛']},
    {name:'瑞典',cities:['斯德哥尔摩','哥德堡','马尔默','阿比斯库','尤卡斯耶尔维/冰旅馆']},
    {name:'瑞士',cities:['因特拉肯','琉森','苏黎世','少女峰','采尔马特','日内瓦']},
    {name:'塞尔维亚',cities:['贝尔格莱德','诺维萨德','尼什']},
    {name:'塞浦路斯',cities:['帕福斯','利马索尔','尼科西亚']},
    {name:'圣马力诺',cities:['圣马力诺城']},
    {name:'斯洛伐克',cities:['布拉迪斯拉发','高塔特拉山']},
    {name:'斯洛文尼亚',cities:['卢布尔雅那','布莱德湖','波斯托伊纳洞穴']},
    {name:'乌克兰',cities:['基辅','利沃夫','敖德萨']},
    {name:'西班牙',cities:['巴塞罗那','马德里','塞维利亚','格拉纳达','圣塞巴斯蒂安','瓦伦西亚','毕尔巴鄂','马略卡岛']},
    {name:'希腊',cities:['圣托里尼','雅典','米科诺斯','罗德岛','科孚岛','克里特岛']},
    {name:'匈牙利',cities:['布达佩斯','埃格尔','蒂豪尼']},
    {name:'冰岛',cities:['雷克雅未克','黄金圈','南岸','蓝湖','阿克雷里','斯奈山半岛','西峡湾']},
    {name:'英国',cities:['伦敦','爱丁堡','牛津','巴斯','科茨沃尔德','约克','剑桥','湖区','苏格兰高地']},
    {name:'意大利',cities:['罗马','威尼斯','佛罗伦萨','米兰','那不勒斯','阿马尔菲','西西里','五渔村','都灵']},
    {name:'爱尔兰',cities:['都柏林','戈尔韦','科克','莫赫悬崖','基拉尼']},
    {name:'爱沙尼亚',cities:['塔林','塔尔图','萨列马岛']},
    {name:'北马其顿',cities:['斯科普里','奥赫里德']},
    {name:'梵蒂冈',cities:['梵蒂冈城']},
  ]},
  { name:'🌍 非洲', countries:[
    {name:'埃及',cities:['开罗/吉萨金字塔','卢克索','阿斯旺','亚历山大','红海/赫尔格达','西奈半岛']},
    {name:'埃塞俄比亚',cities:['亚的斯亚贝巴','拉利贝拉','贡德尔','达纳基尔']},
    {name:'博茨瓦纳',cities:['奥卡万戈三角洲','乔贝','中卡拉哈里']},
    {name:'津巴布韦',cities:['维多利亚瀑布','万基国家公园']},
    {name:'肯尼亚',cities:['马赛马拉','内罗毕','安博塞利','拉穆岛','蒙巴萨']},
    {name:'卢旺达',cities:['基加利','火山国家公园','基伍湖']},
    {name:'马达加斯加',cities:['塔那那利佛','贝伦蒂','穆龙达瓦','诺西贝']},
    {name:'毛里求斯',cities:['路易港','黑河峡谷','罗德里格斯岛']},
    {name:'摩洛哥',cities:['马拉喀什','菲斯','舍夫沙万','卡萨布兰卡','梅尔祖卡沙漠','索维拉']},
    {name:'纳米比亚',cities:['纳米布沙漠','埃托沙','鱼河峡谷','温得和克']},
    {name:'南非',cities:['开普敦','约翰内斯堡','克鲁格公园','花园大道','德拉肯斯堡']},
    {name:'塞内加尔',cities:['达喀尔','戈雷岛','圣路易']},
    {name:'塞舌尔',cities:['马埃岛','普拉斯林岛','拉迪格岛']},
    {name:'坦桑尼亚',cities:['塞伦盖蒂','乞力马扎罗','桑给巴尔','恩戈罗恩戈罗']},
    {name:'突尼斯',cities:['突尼斯城','迦太基','西迪布萨义德','撒哈拉/杜兹']},
    {name:'乌干达',cities:['坎帕拉','布温迪','穆尔奇森瀑布']},
    {name:'赞比亚',cities:['维多利亚瀑布/利文斯通','南卢安瓜']},
    {name:'留尼汪',cities:['圣但尼','皮通德拉富尔内斯火山']},
    {name:'加纳',cities:['阿克拉','开普科斯特','库马西']},
  ]},
  { name:'🌎 美洲', countries:[
    {name:'阿根廷',cities:['布宜诺斯艾利斯','巴塔哥尼亚','伊瓜苏瀑布','门多萨','乌斯怀亚/世界尽头']},
    {name:'巴拉圭',cities:['亚松森']},
    {name:'巴拿马',cities:['巴拿马城','博卡斯德尔托罗','圣布拉斯群岛']},
    {name:'巴西',cities:['里约热内卢','伊瓜苏瀑布','萨尔瓦多','亚马逊/马瑙斯','圣保罗']},
    {name:'秘鲁',cities:['马丘比丘','库斯科','利马','的的喀喀湖','彩虹山','亚马逊雨林']},
    {name:'玻利维亚',cities:['乌尤尼盐湖','拉巴斯','波托西','天空之镜']},
    {name:'伯利兹',cities:['伯利兹城','安伯格里斯岛','蓝洞']},
    {name:'厄瓜多尔',cities:['加拉帕戈斯群岛','基多','库延卡','奥塔瓦洛']},
    {name:'哥伦比亚',cities:['卡塔赫纳','麦德林','波哥大','咖啡产区']},
    {name:'哥斯达黎加',cities:['阿雷纳尔火山','蒙特沃德','托尔图格罗','圣何塞']},
    {name:'古巴',cities:['哈瓦那','特立尼达','巴拉德罗','比尼亚莱斯']},
    {name:'圭亚那',cities:['乔治敦','卡伊图尔瀑布']},
    {name:'洪都拉斯',cities:['科潘遗址','罗阿坦岛']},
    {name:'加拿大',cities:['温哥华','班夫','魁北克城','多伦多','维多利亚','蒙特利尔','育空','贾斯珀']},
    {name:'牙买加',cities:['金斯敦','蒙特哥贝','尼格里尔']},
    {name:'墨西哥',cities:['墨西哥城','坎昆','图卢姆','瓦哈卡','圣克里斯托瓦尔','科苏梅尔岛','铜峡谷']},
    {name:'尼加拉瓜',cities:['马那瓜','格拉纳达']},
    {name:'苏里南',cities:['帕拉马里博']},
    {name:'危地马拉',cities:['安提瓜','阿蒂特兰湖','蒂卡尔']},
    {name:'委内瑞拉',cities:['安赫尔瀑布','卡奈马','洛斯罗克斯群岛']},
    {name:'乌拉圭',cities:['蒙得维的亚','埃斯特角城','科洛尼亚']},
    {name:'美国',cities:['纽约','洛杉矶','旧金山','夏威夷','拉斯维加斯','迈阿密','新奥尔良','大峡谷','黄石公园','波士顿','芝加哥','阿拉斯加','西雅图','纳什维尔']},
    {name:'多米尼加',cities:['蓬塔卡纳','圣多明各','萨曼纳']},
    {name:'智利',cities:['圣地亚哥','阿塔卡马沙漠','托雷斯德尔潘恩','复活节岛','瓦尔帕莱索']},
  ]},
  { name:'🦘 大洋洲', countries:[
    {name:'澳大利亚',cities:['悉尼','墨尔本','乌鲁鲁/艾尔斯岩','大堡礁','塔斯马尼亚','黄金海岸','珀斯','布里斯班','阿德莱德','达尔文','蓝山','凯恩斯']},
    {name:'斐济',cities:['维提岛','南迪','玛玛努卡群岛']},
    {name:'基里巴斯',cities:['南塔拉瓦']},
    {name:'马绍尔群岛',cities:['马朱罗']},
    {name:'密克罗尼西亚',cities:['楚克泻湖','雅浦岛']},
    {name:'瑙鲁',cities:['亚伦']},
    {name:'帕劳',cities:['科罗尔','石头岛','鸭嘴鱼湖']},
    {name:'萨摩亚',cities:['阿皮亚','萨瓦伊岛']},
    {name:'所罗门群岛',cities:['霍尼亚拉']},
    {name:'汤加',cities:['努库阿洛法','瓦瓦乌群岛']},
    {name:'图瓦卢',cities:['富纳富提']},
    {name:'瓦努阿图',cities:['维拉港','坦纳岛火山']},
    {name:'新西兰',cities:['皇后镇','奥克兰','基督城','峡湾国家公园','罗托鲁阿','霍比特屯','威灵顿']},
    {name:'法属波利尼西亚/塔希提',cities:['帕皮提','波拉波拉岛','莫雷阿岛']},
    {name:'巴布亚新几内亚',cities:['莫尔斯比港','戈罗卡']},
  ]},
  { name:'❄️ 极地', countries:[
    {name:'南极洲',cities:['南极点','麦克默多站','半岛地区','南乔治亚岛']},
    {name:'格陵兰(丹麦)',cities:['努克','伊卢利萨特冰湾','迪斯科湾','东格陵兰']},
    {name:'斯瓦尔巴群岛(挪威)',cities:['朗伊尔城','新奥尔松','北极熊观测地']},
    {name:'北极地区',cities:['北极点','弗朗茨约瑟夫地群岛']},
    {name:'阿拉斯加(美国)',cities:['费尔班克斯/北极光','迪纳利国家公园','冰川湾']},
  ]},
];

const ALL_COUNTRIES = CONTINENTS.flatMap(c => c.countries);

const EMOJIS = [
  '🗼','🏯','🏛','🕌','⛩','🗽','🏰','🕍','🛕','🏟',
  '🌋','🏔','🌊','🏝','🏜','🌅','🌄','🌃','🌉','🌌',
  '🌿','🌺','🌸','🍁','🌵','🎋','🌾','🌲','🏕','🗺',
  '✈️','🚂','🚢','⛵','🚁','🛳','🚗','🚌','🏍','🛵',
  '🚴','🚶','🛺','🚠','🚞','🛶','🚤','🛥','🚀','🛸',
  '🧗','🏄','🤿','🎿','⛷','🏂','🪂','🧘','🏇','🚵',
  '🤸','🏊','🎣','🧭','🏋','⛺','🎯','🎽','🥾','🧳',
  '🍜','🍣','🍕','🌮','🥘','🫕','🍱','🥗','🍛','🫔',
  '🍷','🍺','☕','🧋','🍵','🥂','🍸','🍹','🧃','🫖',
  '🦁','🐘','🦒','🦓','🐊','🦅','🦜','🐋','🦩','🦘',
  '🦬','🐪','🦏','🦛','🐆','🦋','🐬','🦈','🐧','🦭',
  '🫎','🦌','♨️','❄️','🌨','🏞','🌠','🗻','🛷','🧊',
];


function CountdownCard({ trips }) {
  const today = new Date();
  today.setHours(0,0,0,0);

  // 找最近的未来旅程
  const upcoming = trips
    .filter(t => t.plannedDate)
    .map(t => {
      const parts = t.plannedDate.split('.');
      const d = new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2]));
      return { ...t, dateObj: d };
    })
    .filter(t => t.dateObj >= today)
    .sort((a,b) => a.dateObj - b.dateObj)[0];

  if (!upcoming) return null;

  const diff = Math.ceil((upcoming.dateObj - today) / (1000*60*60*24));

  return (
    <View style={cd.card}>
      <View style={cd.left}>
        <Text style={cd.days}>{diff}</Text>
        <Text style={cd.daysLabel}>天后出发</Text>
      </View>
      <View style={cd.right}>
        <Text style={cd.emoji}>{upcoming.emoji}</Text>
        <Text style={cd.city}>{upcoming.city}</Text>
        <Text style={cd.date}>{upcoming.plannedDate}</Text>
      </View>
      <View style={cd.glow}/>
    </View>
  );
}

const cd = StyleSheet.create({
  card:{backgroundColor:'#0D2B28',borderWidth:1.5,borderColor:'#4ECDC4',borderRadius:16,padding:20,flexDirection:'row',alignItems:'center',marginBottom:20,overflow:'hidden'},
  left:{alignItems:'center',marginRight:24,minWidth:70},
  days:{fontSize:52,color:'#4ECDC4',fontWeight:'300',lineHeight:56},
  daysLabel:{fontSize:12,color:'#F0EDE8',letterSpacing:1,marginTop:2},
  right:{flex:1},
  emoji:{fontSize:32,marginBottom:6},
  city:{fontSize:20,color:'#FFFFFF',fontWeight:'500'},
  date:{fontSize:13,color:'#4ECDC4',marginTop:4},
  glow:{position:'absolute',right:-20,top:-20,width:80,height:80,borderRadius:40,backgroundColor:'#4ECDC4',opacity:0.08},
});

async function nominatimSearch(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'WanderNote/1.0' },
      signal: controller.signal,
    });
    clearTimeout(timer);
    const data = await res.json();
    if (data?.length > 0) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch (e) {
    clearTimeout(timer);
  }
  return null;
}

// 中英文双重geocode，提升小地名识别率
const ZH_TO_EN = {
  // 欧洲
  '哈尔施塔特': 'Hallstatt', '因特拉肯': 'Interlaken', '少女峰': 'Jungfrau',
  '采尔马特': 'Zermatt', '卡帕多奇亚': 'Cappadocia', '棉花堡': 'Pamukkale',
  '圣托里尼': 'Santorini', '杜布罗夫尼克': 'Dubrovnik', '普利特维采': 'Plitvice Lakes',
  '克鲁姆洛夫': 'Cesky Krumlov', '新天鹅堡': 'Neuschwanstein Castle',
  '罗腾堡': 'Rothenburg ob der Tauber', '科托尔': 'Kotor',
  '布莱德湖': 'Lake Bled', '波斯托伊纳洞穴': 'Postojna Cave',
  '五渔村': 'Cinque Terre', '阿马尔菲': 'Amalfi',
  '罗弗敦群岛': 'Lofoten Islands', '盖朗厄尔峡湾': 'Geirangerfjord',
  '弗洛姆': 'Flam', '特罗姆瑟': 'Tromso',
  '卡罗维发利': 'Karlovy Vary', '大特尔诺沃': 'Veliko Tarnovo',
  '里拉修道院': 'Rila Monastery', '马特洪峰': 'Matterhorn',
  '科孚岛': 'Corfu', '克里特岛': 'Crete', '米科诺斯': 'Mykonos',
  '罗德岛': 'Rhodes', '萨拉热窝': 'Sarajevo', '莫斯塔尔': 'Mostar',
  '布德瓦': 'Budva', '黑山': 'Montenegro',
  '辛特拉': 'Sintra', '阿尔加维': 'Algarve',
  '科茨沃尔德': 'Cotswolds', '湖区': 'Lake District',
  '苏格兰高地': 'Scottish Highlands',
  // 亚洲
  '吴哥窟': 'Angkor Wat', '琅勃拉邦': 'Luang Prabang',
  '蒲甘': 'Bagan', '茵莱湖': 'Inle Lake', '万荣': 'Vang Vieng',
  '会安': 'Hoi An', '下龙湾': 'Ha Long Bay', '顺化': 'Hue',
  '大叻': 'Da Lat', '富国岛': 'Phu Quoc',
  '龙目岛': 'Lombok', '科莫多岛': 'Komodo Island',
  '长滩岛': 'Boracay', '巴拉望岛': 'Palawan',
  '白川乡': 'Shirakawago', '高山': 'Takayama',
  '箱根': 'Hakone', '镰仓': 'Kamakura',
  '虎穴寺': 'Tiger Nest Monastery', '普纳卡': 'Punakha',
  '锡吉里亚': 'Sigiriya', '加勒': 'Galle',
  '洪扎谷地': 'Hunza Valley', '帕米尔高原': 'Pamir Plateau',
  '卡兹别吉': 'Kazbegi', '第比利斯': 'Tbilisi',
  '布哈拉': 'Bukhara', '撒马尔罕': 'Samarkand', '希瓦': 'Khiva',
  '佩特拉': 'Petra', '瓦迪拉姆': 'Wadi Rum',
  '以弗所': 'Ephesus', '博德鲁姆': 'Bodrum',
  '棉花堡': 'Pamukkale', '安塔利亚': 'Antalya',
  '设拉子': 'Shiraz', '伊斯法罕': 'Isfahan', '亚兹德': 'Yazd',
  '瓦拉纳西': 'Varanasi', '拉达克': 'Ladakh',
  '泰姬陵': 'Taj Mahal', '斋浦尔': 'Jaipur',
  '喀拉拉邦': 'Kerala',
  // 美洲
  '马丘比丘': 'Machu Picchu', '乌尤尼盐湖': 'Uyuni Salt Flat',
  '彩虹山': 'Rainbow Mountain Peru', '的的喀喀湖': 'Lake Titicaca',
  '巴塔哥尼亚': 'Patagonia', '乌斯怀亚': 'Ushuaia',
  '伊瓜苏瀑布': 'Iguazu Falls', '安赫尔瀑布': 'Angel Falls',
  '加拉帕戈斯群岛': 'Galapagos Islands',
  '托雷斯德尔潘恩': 'Torres del Paine', '阿塔卡马沙漠': 'Atacama Desert',
  '科潘遗址': 'Copan Ruins', '蒂卡尔': 'Tikal',
  '阿蒂特兰湖': 'Lake Atitlan', '安提瓜': 'Antigua Guatemala',
  '卡塔赫纳': 'Cartagena Colombia', '咖啡产区': 'Coffee Region Colombia',
  '大峡谷': 'Grand Canyon', '黄石公园': 'Yellowstone',
  // 非洲
  '马赛马拉': 'Masai Mara', '塞伦盖蒂': 'Serengeti',
  '恩戈罗恩戈罗': 'Ngorongoro', '桑给巴尔': 'Zanzibar',
  '纳米布沙漠': 'Namib Desert', '鱼河峡谷': 'Fish River Canyon',
  '维多利亚瀑布': 'Victoria Falls', '奥卡万戈三角洲': 'Okavango Delta',
  '舍夫沙万': 'Chefchaouen', '梅尔祖卡沙漠': 'Merzouga Desert',
  '拉利贝拉': 'Lalibela', '达纳基尔': 'Danakil Depression',
  '戈雷岛': 'Goree Island',
  // 大洋洲/极地
  '乌鲁鲁': 'Uluru', '大堡礁': 'Great Barrier Reef',
  '蓝山': 'Blue Mountains', '塔斯马尼亚': 'Tasmania',
  '峡湾国家公园': 'Fiordland National Park', '霍比特屯': 'Hobbiton',
  '朗伊尔城': 'Longyearbyen', '迪纳利国家公园': 'Denali National Park',
  '冰川湾': 'Glacier Bay', '卡伊图尔瀑布': 'Kaieteur Falls',
};

async function geocodeCity(cityName, countryName) {
  // 先用中文搜
  const result = await nominatimSearch(`${cityName} ${countryName}`);
  if (result) return result;
  // 中文失败，尝试英文映射
  const enName = ZH_TO_EN[cityName];
  if (enName) {
    const result2 = await nominatimSearch(enName);
    if (result2) return result2;
  }
  // 最后只用城市名再试一次
  return await nominatimSearch(cityName);
}

export default function HomeScreen({ navigation, trips, setTrips, isPro, freeTripLimit }) {
  const { t } = useTranslation();
  const [showAdd, setShowAdd] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedContinent, setSelectedContinent] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedCities, setSelectedCities] = useState([]);
  const [customCity, setCustomCity] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState(null);
  const [search, setSearch] = useState('');
  const [plannedDate, setPlannedDate] = useState('');
  const [plannedDateObj, setPlannedDateObj] = useState(new Date(Date.now() + 7*24*60*60*1000));
  const [enableCountdown, setEnableCountdown] = useState(false);
  const [forecast, setForecast] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(false);

  const resetForm = () => {
    setStep(1); setSelectedContinent(null); setSelectedCountry(null);
    setSelectedCities([]); setCustomCity(''); setSelectedEmoji(null);
    setSearch('');
    setPlannedDate('');
    setPlannedDateObj(new Date(Date.now() + 7*24*60*60*1000));
    setEnableCountdown(false);
    setForecast(null);
  };

  const addTrip = () => {
    const now = new Date();
    const dateStr = `${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}`;
    const emoji = selectedEmoji || '🌍';
    const cityName = customCity.trim() || selectedCities.join(' · ');
    if (!cityName) return;
    const newTrip = {
      id: Date.now(), city: cityName,
      country: selectedCountry.name, date: dateStr, emoji, days: [],
      coords: null,
      plannedDate: enableCountdown ? (() => {
        const d = plannedDateObj;
        return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;
      })() : null
    };
    setTrips(prev => [newTrip, ...prev]);
    resetForm(); setShowAdd(false);
    navigation.navigate('TripDetail', { tripId: newTrip.id });
    // 异步获取坐标，不阻塞UI
    geocodeCity(cityName, selectedCountry?.name || '').then(coords => {
      if (coords) {
        setTrips(prev => prev.map(t => t.id === newTrip.id ? { ...t, coords } : t));
      }
    }).catch(() => {});
  };

  const deleteTrip = (tripId, cityName) => {
    if (deletingId) return; // 正在删除中，忽略重复触发
    Alert.alert('删除旅程', `确定删除「${cityName}」？`, [
      { text: t('cancel'), style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          setDeletingId(tripId);
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user?.id) throw new Error('未登录');
            await deleteTripAndRelated(user.id, tripId);
            setTrips(prev => prev.filter(t => t.id !== tripId));
          } catch (e) {
            console.error('deleteTrip error:', e.message);
            Alert.alert(t('alert_delete_failed'), e.message || t('alert_network_retry'));
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  };

  const handleNewTrip = () => {
    if (!isPro && trips.length >= (freeTripLimit||3)) {
      Alert.alert(t('alert_pro_limit'), t('alert_pro_limit_desc').replace('%d', freeTripLimit||3), [{text:t('cancel'), style:'cancel'},{text:t('alert_upgrade'), onPress:()=>{}}]
      );
      return;
    }
    resetForm(); setShowAdd(true);
  };

  const [tripSearch, setTripSearch] = useState('');
  const [sortBy, setSortBy] = useState('date'); // date | name
  const [deletingId, setDeletingId] = useState(null);

  // 搜索同时匹配国家名和城市名
  const searchResults = search ? ALL_COUNTRIES.flatMap(c => {
    if (c.name.includes(search)) return [{ type: 'country', country: c }];
    const matchedCities = c.cities.filter(city => city.includes(search));
    return matchedCities.map(city => ({ type: 'city', country: c, city }));
  }) : null;

  const filteredTrips = trips
    .filter(t => tripSearch ? t.city.includes(tripSearch) || t.country.includes(tripSearch) : true)
    .sort((a,b) => sortBy === 'name' ? a.city.localeCompare(b.city) : b.date.localeCompare(a.date));
  const hasSelection = selectedCities.length > 0 || customCity.trim().length > 0;

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" />
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.header}>
          <View>
            <Text style={s.title}>WanderNote</Text>
            <Text style={s.subtitle}>记录每一次远行</Text>
          </View>
          <TouchableOpacity style={s.addBtn} onPress={handleNewTrip}>
            <Text style={s.addBtnText}>+ 新旅程</Text>
          </TouchableOpacity>
        </View>

        <CountdownCard trips={trips} />
        <View style={s.statsRow}>
          {[
            [String(trips.length),t('stat_trips')],
            [String(trips.reduce((a,t)=>a+t.days.reduce((b,d)=>b+d.memos.length,0),0)),t('stat_memos')],
            [String(trips.reduce((a,t)=>a+t.days.reduce((b,d)=>b+(d.photos||[]).length,0),0)),t('stat_photos')],
            // [String(trips.reduce((a,t)=>a+t.days.reduce((b,d)=>b+(d.videos||[]).length,0),0)),t('stat_videos')], // v2.0
            [String(trips.reduce((a,t)=>a+t.days.length,0)),t('stat_days')],
          ].map(([n,l]) => (
            <View key={l} style={s.statBox}>
              <Text style={s.statNum}>{n}</Text>
              <Text style={s.statLabel}>{l}</Text>
            </View>
          ))}
        </View>

        <Text style={s.sectionTitle}>最近旅程</Text>
        <View style={{flexDirection:'row',gap:10,marginBottom:14}}>
          <TextInput
            style={{flex:1,backgroundColor:'#161616',borderRadius:12,padding:10,color:'#F0EDE8',fontSize:14,borderWidth:1,borderColor:'#242424'}}
            placeholder="搜索旅程..."
            placeholderTextColor="#444"
            value={tripSearch}
            onChangeText={setTripSearch}
          />
          <TouchableOpacity
            onPress={()=>setSortBy(sortBy==='date'?'name':'date')}
            style={{backgroundColor:'#161616',borderRadius:12,padding:10,borderWidth:1,borderColor:'#242424',justifyContent:'center'}}>
            <Text style={{color:'#D4AF37',fontSize:12}}>{sortBy==='date'?t('home_sort_date'):t('home_sort_name')}</Text>
          </TouchableOpacity>
        </View>
        {trips.length === 0 && (
          <View style={s.emptyBox}>
            <View style={s.emptyCard}>
              <Text style={s.emptyEmoji}>🌍</Text>
              <Text style={s.emptyTitle}>开始你的第一段旅程</Text>
              <Text style={s.emptyText}>世界那么大，从记录第一步开始</Text>
              <TouchableOpacity style={s.emptyBtn} onPress={handleNewTrip}>
                <Text style={s.emptyBtnText}>+ 新建旅程</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        {filteredTrips.map(trip => (
          <TouchableOpacity key={trip.id} style={s.card}
            onPress={() => navigation.navigate('TripDetail', { tripId: trip.id })}
            onLongPress={() => deleteTrip(trip.id, trip.city)}
            disabled={deletingId === trip.id}>
            <View style={s.cardEmoji}><Text style={{fontSize:22}}>{trip.emoji}</Text></View>
            <View style={{flex:1}}>
              <Text style={s.cityName} numberOfLines={1} ellipsizeMode='tail'>{trip.city}</Text>
              <Text style={s.countryName}>{trip.country} · {trip.days.length}天 · {trip.days.reduce((a,d)=>a+d.memos.length,0)}条感言</Text>
            </View>
            <Text style={s.cardDate}>{trip.plannedDate || trip.date}</Text>
          </TouchableOpacity>
        ))}
        {trips.length > 0 && <Text style={s.longPressHint}>长按旅程卡片可删除</Text>}
      </ScrollView>

      <Modal visible={showAdd} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={s.overlay}>
          <View style={s.sheet}>

            {/* Step 1: 选国家 */}
            {step===1 && <>
              <View style={s.sheetHeader}>
                <Text style={s.sheetTitle}>选择目的地</Text>
                <TouchableOpacity onPress={()=>{resetForm();setShowAdd(false);}}><Text style={s.closeBtn}>✕</Text></TouchableOpacity>
              </View>
              <TextInput style={s.searchBox} placeholder="搜索国家/地区..." placeholderTextColor="#444" value={search} onChangeText={t=>{setSearch(t);setSelectedContinent(null);}} />
              <ScrollView style={{maxHeight:420}} nestedScrollEnabled>
                {searchResults && searchResults.map((item, idx)=>(
                  <TouchableOpacity key={idx} style={s.listItem} onPress={()=>{
                    setSelectedCountry(item.country);
                    if (item.type === 'city') {
                      setSelectedCities([item.city]);
                      setStep(3);
                    } else {
                      setStep(2);
                    }
                  }}>
                    <Text style={s.listItemText}>
                      {item.type === 'city' ? `${item.city}（${item.country.name}）` : item.country.name}
                    </Text>
                  </TouchableOpacity>
                ))}
                {!search && !selectedContinent && CONTINENTS.map(cont=>(
                  <TouchableOpacity key={cont.name} style={s.continentItem} onPress={()=>setSelectedContinent(cont)}>
                    <Text style={s.continentText}>{cont.name}</Text>
                    <Text style={s.continentArrow}>→</Text>
                  </TouchableOpacity>
                ))}
                {!search && selectedContinent && <>
                  <TouchableOpacity style={{paddingVertical:12,marginBottom:4}} onPress={()=>setSelectedContinent(null)}>
                    <Text style={s.backBtn}>← {selectedContinent.name}</Text>
                  </TouchableOpacity>
                  {selectedContinent.countries.map(c=>(
                    <TouchableOpacity key={c.name} style={s.listItem} onPress={()=>{setSelectedCountry(c);setStep(2);}}>
                      <Text style={s.listItemText}>{c.name}</Text>
                    </TouchableOpacity>
                  ))}
                </>}
              </ScrollView>
            </>}

            {/* Step 2: 多选城市 */}
            {step===2 && <>
              <View style={s.sheetHeader}>
                <TouchableOpacity onPress={()=>setStep(1)}><Text style={s.backBtn}>← {selectedCountry?.name}</Text></TouchableOpacity>
                <TouchableOpacity onPress={()=>{resetForm();setShowAdd(false);}}><Text style={s.closeBtn}>✕</Text></TouchableOpacity>
              </View>
              <Text style={s.inputLabel}>推荐目的地 <Text style={{color:'#444',fontSize:10}}>（可多选）</Text></Text>
              <ScrollView style={{maxHeight:200}} nestedScrollEnabled>
                <View style={s.cityGrid}>
                  {selectedCountry?.cities.map(c=>(
                    <TouchableOpacity
                      key={c}
                      style={[s.cityChip, selectedCities.includes(c) && s.cityChipActive]}
                      onPress={()=>{
                        setCustomCity('');
                        setSelectedCities(prev =>
                          prev.includes(c) ? prev.filter(x=>x!==c) : [...prev, c]
                        );
                      }}>
                      <Text style={[s.cityChipText, selectedCities.includes(c) && s.cityChipTextActive]}>
                        {selectedCities.includes(c) ? '✓ ' : ''}{c}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <Text style={[s.inputLabel,{marginTop:16}]}>或手动输入其他地点</Text>
              <TextInput
                style={s.input}
                placeholder="城市、景点、地区..."
                placeholderTextColor="#444"
                value={customCity}
                onChangeText={t=>{setCustomCity(t); if(t) setSelectedCities([]);}}
              />

              {hasSelection && (
                <View>
                  {selectedCities.length > 0 && (
                    <Text style={s.selectedHint}>
                      已选 {selectedCities.length} 个：{selectedCities.join(' · ')}
                    </Text>
                  )}
                  <TouchableOpacity style={s.nextBtn} onPress={()=>{
                    setStep(3);
                    const cityName = customCity.trim() || selectedCities[0];
                    const coords = getCityCoords(cityName);
                    if (coords) {
                      setForecastLoading(true);
                      fetchWeatherForecast(coords.lat, coords.lng)
                        .then(f => setForecast(f))
                        .catch(() => {})
                        .finally(() => setForecastLoading(false));
                    }
                  }}>
                    <Text style={s.nextBtnText}>下一步 →</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>}

            {/* Step 3: 选 emoji */}
            {step===3 && <>
              <View style={s.sheetHeader}>
                <TouchableOpacity onPress={()=>setStep(2)}>
                  <Text style={s.backBtn}>← {customCity || selectedCities.join('、')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={()=>{resetForm();setShowAdd(false);}}><Text style={s.closeBtn}>✕</Text></TouchableOpacity>
              </View>

              {/* 目的地天气预报 */}
              {forecastLoading && (
                <View style={{backgroundColor:'#0D2B28',borderRadius:12,padding:12,marginBottom:12,alignItems:'center'}}>
                  <Text style={{color:'#4ECDC490',fontSize:13}}>正在获取目的地天气...</Text>
                </View>
              )}
              {forecast && !forecastLoading && (
                <View style={{backgroundColor:'#0D2B28',borderRadius:12,padding:12,marginBottom:12,borderWidth:1,borderColor:'#4ECDC430'}}>
                  <Text style={{color:'#4ECDC4',fontSize:12,marginBottom:8,letterSpacing:1}}>📍 目的地未来7天</Text>
                  <View style={{flexDirection:'row',gap:6}}>
                    {forecast.slice(0,7).map((day,i)=>(
                      <View key={i} style={{flex:1,alignItems:'center',gap:2}}>
                        <Text style={{fontSize:10,color:'#555'}}>{i===0?'今':day.date.slice(5).replace('-','/')}</Text>
                        <Text style={{fontSize:16}}>{day.emoji}</Text>
                        <Text style={{fontSize:10,color:'#4ECDC4'}}>{Math.round(day.maxTemp)}°</Text>
                        <Text style={{fontSize:10,color:'#555'}}>{Math.round(day.minTemp)}°</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                <Text style={{fontSize:16,color:'#F0EDE8',fontWeight:'500'}}>✈️ 设置出发倒计时</Text>
                <TouchableOpacity
                  onPress={()=>setEnableCountdown(!enableCountdown)}
                  style={{backgroundColor:enableCountdown?'#4ECDC4':'#D4AF3730',borderRadius:14,paddingHorizontal:16,paddingVertical:6,borderWidth:1,borderColor:enableCountdown?'#4ECDC4':'#D4AF37'}}>
                  <Text style={{color:enableCountdown?'#0D0D0D':'#D4AF37',fontSize:13,fontWeight:'600'}}>
                    {enableCountdown?t('new_trip_enabled'):t('new_trip_enable')}
                  </Text>
                </TouchableOpacity>
              </View>
              {enableCountdown && <View style={{backgroundColor:'#1A1A1A',borderRadius:14,marginBottom:16,overflow:'hidden',borderWidth:1,borderColor:'#2A2A2A'}}>
                <DateTimePicker
                  value={plannedDateObj}
                  mode="date"
                  display="spinner"
                  maximumDate={new Date(2035,11,31)}
                  onChange={(_,date)=>{ if(date) setPlannedDateObj(date); }}
                  locale="zh-CN"
                  style={{height:130}}
                  textColor="#F0EDE8"
                />
              </View>}
              <Text style={s.inputLabel}>
                选择图标 <Text style={{color:'#444',fontSize:10}}>（可选，不选默认🌍）</Text>
              </Text>
              <ScrollView style={{maxHeight:260}} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                <View style={s.emojiRow}>
                  {EMOJIS.map((e,i)=>(
                    <TouchableOpacity key={`${e}_${i}`} style={[s.emojiBtn,selectedEmoji===e&&s.emojiBtnActive]} onPress={()=>setSelectedEmoji(selectedEmoji===e?null:e)}>
                      <Text style={{fontSize:22}}>{e}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <View style={{flexDirection:'row',gap:12,marginTop:16}}>
                <TouchableOpacity style={s.cancelBtn} onPress={()=>{resetForm();setShowAdd(false);}}>
                  <Text style={s.cancelText}>取消</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.confirmBtn} onPress={addTrip}>
                  <Text style={s.confirmText}>开始记录 →</Text>
                </TouchableOpacity>
              </View>
            </>}

          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:{flex:1,backgroundColor:'#0D0D0D'},
  scroll:{padding:24,paddingBottom:100},
  header:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',marginBottom:24,marginTop:12},
  title:{fontSize:32,color:'#F0EDE8',fontWeight:'300',letterSpacing:-1},
  subtitle:{fontSize:14,color:'#555',marginTop:4},
  addBtn:{backgroundColor:'#D4AF3720',borderWidth:1,borderColor:'#D4AF3750',borderRadius:20,paddingHorizontal:16,paddingVertical:8},
  addBtnText:{color:'#D4AF37',fontSize:13},
  statsRow:{flexDirection:'row',gap:12,marginBottom:28},
  statBox:{flex:1,backgroundColor:'#161616',borderRadius:12,padding:14,alignItems:'center',borderWidth:1,borderColor:'#242424'},
  statNum:{fontSize:22,color:'#D4AF37',fontWeight:'300'},
  statLabel:{fontSize:10,color:'#555',marginTop:4},
  sectionTitle:{fontSize:11,color:'#555',letterSpacing:3,textTransform:'uppercase',marginBottom:14},
  emptyBox:{alignItems:'center',paddingVertical:24,paddingHorizontal:8},
  emptyCard:{borderWidth:1,borderColor:'#2A2A2A',borderStyle:'dashed',borderRadius:20,padding:32,alignItems:'center',width:'100%'},
  emptyEmoji:{fontSize:52,marginBottom:16},
  emptyTitle:{fontSize:18,color:'#F0EDE8',fontWeight:'300',marginBottom:8},
  emptyText:{fontSize:14,color:'#444',textAlign:'center',lineHeight:20,marginBottom:20},
  emptyHint:{fontSize:13,color:'#333',marginTop:6},
  emptyBtn:{backgroundColor:'#D4AF3720',borderWidth:1,borderColor:'#D4AF3750',borderRadius:20,paddingHorizontal:20,paddingVertical:10},
  emptyBtnText:{color:'#D4AF37',fontSize:14},
  card:{backgroundColor:'#161616',borderRadius:14,padding:16,marginBottom:10,flexDirection:'row',alignItems:'center',gap:14,borderWidth:1,borderColor:'#242424'},
  cardEmoji:{width:44,height:44,borderRadius:12,backgroundColor:'#D4AF3720',alignItems:'center',justifyContent:'center'},
  cityName:{fontSize:16,color:'#F0EDE8'},
  countryName:{fontSize:12,color:'#555',marginTop:3},
  cardDate:{fontSize:11,color:'#444'},
  longPressHint:{textAlign:'center',color:'#333',fontSize:11,marginTop:8},
  overlay:{flex:1,justifyContent:'flex-end',backgroundColor:'#000000BB'},
  sheet:{backgroundColor:'#111',borderTopLeftRadius:24,borderTopRightRadius:24,padding:24,paddingBottom:48,borderTopWidth:1,borderColor:'#2A2A2A',maxHeight:'92%'},
  sheetHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:20},
  sheetTitle:{fontSize:20,color:'#F0EDE8',fontWeight:'300'},
  closeBtn:{fontSize:18,color:'#555',padding:4},
  backBtn:{fontSize:15,color:'#D4AF37'},
  searchBox:{backgroundColor:'#1A1A1A',borderRadius:12,padding:12,color:'#F0EDE8',fontSize:14,marginBottom:12,borderWidth:1,borderColor:'#2A2A2A'},
  continentItem:{padding:18,borderBottomWidth:1,borderBottomColor:'#1A1A1A',flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  continentText:{fontSize:17,color:'#CCC'},
  continentArrow:{color:'#444',fontSize:16},
  listItem:{padding:16,borderBottomWidth:1,borderBottomColor:'#1A1A1A'},
  listItemText:{fontSize:16,color:'#888'},
  inputLabel:{fontSize:11,color:'#555',letterSpacing:2,textTransform:'uppercase',marginBottom:10},
  cityGrid:{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:8},
  cityChip:{paddingHorizontal:14,paddingVertical:8,borderRadius:20,backgroundColor:'#1A1A1A',borderWidth:1,borderColor:'#2A2A2A'},
  cityChipActive:{backgroundColor:'#D4AF3720',borderColor:'#D4AF37'},
  cityChipText:{fontSize:14,color:'#666'},
  cityChipTextActive:{color:'#D4AF37'},
  input:{backgroundColor:'#1A1A1A',borderRadius:12,padding:14,color:'#F0EDE8',fontSize:15,marginBottom:16,borderWidth:1,borderColor:'#2A2A2A'},
  selectedHint:{color:'#D4AF37',fontSize:12,marginBottom:10,textAlign:'center'},
  nextBtn:{backgroundColor:'#D4AF37',borderRadius:14,padding:16,alignItems:'center'},
  nextBtnText:{color:'#0D0D0D',fontSize:15,fontWeight:'700'},
  emojiRow:{flexDirection:'row',flexWrap:'wrap',gap:8,paddingBottom:8},
  emojiBtn:{width:44,height:44,borderRadius:10,backgroundColor:'#1A1A1A',alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'#2A2A2A'},
  emojiBtnActive:{borderColor:'#D4AF37',backgroundColor:'#D4AF3720'},
  cancelBtn:{flex:1,padding:16,borderRadius:14,backgroundColor:'#1A1A1A',alignItems:'center'},
  cancelText:{color:'#555',fontSize:15},
  confirmBtn:{flex:1,padding:16,borderRadius:14,backgroundColor:'#D4AF37',alignItems:'center'},
  confirmText:{color:'#0D0D0D',fontSize:15,fontWeight:'700'},
});
