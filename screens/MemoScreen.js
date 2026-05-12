import React, { useState, useEffect } from 'react';
import {
  SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput,
  TouchableOpacity, View, Modal, KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@wandernote_memos';

const CATEGORIES = [
  { key: 'travel',  label: '✈️ 旅行',  color: '#D4AF37' },
  { key: 'packing', label: '🧳 打包',  color: '#4ECDC4' },
  { key: 'todo',    label: '✅ 待办',  color: '#6BCB77' },
  { key: 'idea',    label: '💡 灵感',  color: '#FFB347' },
  { key: 'note',    label: '📝 笔记',  color: '#9B8EC4' },
  { key: 'other',   label: '📌 其他',  color: '#888'    },
];

const SMART_PACKING = {
  '城市观光': {
    emoji: '🏙️',
    desc: '日本 / 欧洲 / 东南亚城市游',
    groups: {
      '📋 证件': ['🛂 护照（有效期6个月以上）','📋 签证/电子签确认单','📋 酒店确认单','🎫 回程机票'],
      '💰 财务': ['💳 信用卡','💵 目的地货币现金','🪙 交通卡（如Suica/Octopus）'],
      '📱 电子': ['🔌 转换插头','🔋 充电宝','📱 当地SIM卡/eSIM','📸 相机'],
      '👕 衣物': ['👕 换洗衣物（天数+1套）','🧥 外套（按季节）','👟 舒适步行鞋','🩴 拖鞋'],
      '🧴 日用': ['🧴 洗漱用品','💊 常用药品','🌂 折叠伞','🕶️ 太阳镜'],
      '🎒 特殊': ['🗺️ 离线地图','📱 翻译App离线包','🔒 行李锁'],
    },
  },
  '户外探险': {
    emoji: '🏔️',
    desc: '阿拉斯加 / 冰岛 / 新西兰徒步',
    groups: {
      '📋 证件': ['🛂 护照','🪪 驾照（租车必备）','📋 租车/营地确认单','🎫 回程机票'],
      '💰 财务': ['💳 信用卡','💵 当地现金（偏远备用）'],
      '📱 电子': ['🔌 转换插头','🔋 大容量充电宝（低温掉电快）','📸 相机','📷 三脚架','💾 大容量存储卡'],
      '👕 衣物': ['🧥 防风防水冲锋衣（必备）','🧣 保暖内衣/羽绒服','🧤 防水手套','👢 防水登山靴','🧦 厚羊毛袜','🧢 抓绒帽'],
      '🧴 日用': ['☀️ 防晒霜（雪地/高原反射强）','💊 高反/晕车药','💊 感冒药','🩹 防水创可贴','🦟 防蚊液'],
      '🎒 特殊': ['🐻 熊喷（荒野必备）','🗺️ 离线地图','🌌 极光预报App','🧊 保温水壶','⛽ 出发前加满油'],
    },
  },
  '海岛度假': {
    emoji: '🏖️',
    desc: '夏威夷 / 马尔代夫 / 巴厘岛',
    groups: {
      '📋 证件': ['🛂 护照','📋 签证/电子签确认单','📋 酒店确认单','🎫 回程机票'],
      '💰 财务': ['💳 信用卡','💵 当地现金'],
      '📱 电子': ['🔌 转换插头','🔋 充电宝','📱 当地SIM卡','📸 防水相机/GoPro'],
      '👕 衣物': ['👙 泳衣/泳裤（多带一套）','👕 轻薄夏装','🩴 沙滩拖鞋','👟 休闲鞋','🧥 薄外套（室内冷气强）'],
      '🧴 日用': ['☀️ 防晒霜SPF50+（每天补涂）','🕶️ 偏光太阳镜','💊 晕船药','🦟 防蚊液','💊 常用药品'],
      '🎒 特殊': ['🤿 浮潜装备（或租用）','🏄 冲浪/水上活动预约','🌺 防水袋','💦 保湿喷雾'],
    },
  },
  '自驾公路': {
    emoji: '🚗',
    desc: '美国 / 澳洲 / 冰岛环岛',
    groups: {
      '📋 证件': ['🛂 护照','🪪 驾照原件','📄 驾照翻译件（如需）','📋 签证确认单','📋 租车确认单','🎫 回程机票'],
      '💰 财务': ['💳 信用卡（租车押金用）','💵 现金（偏远地区备用）'],
      '📱 电子': ['🔌 转换插头','🔋 充电宝','📱 当地SIM卡','📸 相机','🚗 行车记录仪','📡 离线导航'],
      '👕 衣物': ['👕 换洗衣物','🧥 冲锋衣','👟 运动鞋','👙 泳衣','🧢 帽子'],
      '🧴 日用': ['☀️ 防晒霜SPF50+','🕶️ 太阳镜','💊 晕车药','🩹 创可贴','🧴 洗漱用品'],
      '🎒 特殊': ['⛽ 出发前加满油','🗺️ 离线地图下载','🥪 长途干粮','📦 真空压缩袋','🔒 行李锁'],
    },
  },
  '商务出行': {
    emoji: '💼',
    desc: '会议 / 考察 / 出差',
    groups: {
      '📋 证件': ['🛂 护照','📋 签证确认单','📋 邀请函/会议确认','🎫 回程机票','💊 处方药证明（如有）'],
      '💰 财务': ['💳 公司信用卡','💳 个人备用卡','💵 当地现金','🧾 发票/报销凭证袋'],
      '📱 电子': ['💻 笔记本电脑','🔌 多口充电器','🔋 充电宝','📱 当地SIM卡','🖱️ 无线鼠标','📊 演示文件备份U盘'],
      '👕 衣物': ['👔 正装（会议用）','👕 商务休闲装','👞 皮鞋','👟 舒适便鞋','🧥 外套'],
      '🧴 日用': ['🧴 洗漱用品','💊 常用药品','😴 眼罩+颈枕（长途飞机）','🌂 折叠伞'],
      '🎒 特殊': ['🖊️ 名片','📋 合同/文件打印件','🔒 行李锁','📦 真空压缩袋'],
    },
  },
  '通用国际': {
    emoji: '🌍',
    desc: '适用于任意目的地',
    groups: {
      '📋 证件': ['🛂 护照（有效期6个月以上）','📋 签证确认单','📋 酒店/行程确认单','🎫 回程机票','💊 处方药证明（如有）'],
      '💰 财务': ['💳 信用卡（多带一张备用）','💵 目的地货币现金','📱 手机支付'],
      '📱 电子': ['🔌 转换插头','🔋 充电宝（<100Wh）','📱 当地SIM卡/eSIM','📸 相机','💾 备用存储卡'],
      '👕 衣物': ['👕 换洗衣物（天数+1套）','👙 泳衣','🧥 外套','👟 舒适鞋','🩴 拖鞋'],
      '🧴 日用': ['🧴 洗漱用品','☀️ 防晒霜','💊 常用药品','🩹 创可贴','🌂 折叠伞'],
      '🎒 特殊': ['🔒 行李锁','📦 真空压缩袋','🛍️ 环保购物袋','🗺️ 离线地图下载'],
    },
  },
};

// ─── 分组折叠组件 ───────────────────────────────────────────────
function PackingGroup({ groupName, items, memoId, onToggle, catColor }) {
  const [open, setOpen] = useState(true);
  const groupItems = items.filter(i => i.groupKey === groupName);
  const total   = groupItems.length;
  const checked = groupItems.filter(i => i.checked).length;
  const pct     = total > 0 ? (checked / total) * 100 : 0;

  return (
    <View style={pg.wrap}>
      <TouchableOpacity style={pg.header} onPress={() => setOpen(o => !o)} activeOpacity={0.7}>
        <View style={{ flex: 1 }}>
          <Text style={pg.groupName}>{groupName}</Text>
          <View style={pg.bar}>
            <View style={[pg.barFill, { width: `${pct}%`, backgroundColor: catColor }]} />
          </View>
        </View>
        <Text style={[pg.count, checked === total && total > 0 && { color: catColor }]}>
          {checked}/{total}
        </Text>
        <Text style={pg.arrow}>{open ? '▾' : '▸'}</Text>
      </TouchableOpacity>

      {open && groupItems.map(item => (
        <TouchableOpacity key={item.id} style={pg.item}
          onPress={() => onToggle(memoId, item.id)} activeOpacity={0.6}>
          <View style={[pg.circle, item.checked && { backgroundColor: catColor, borderColor: catColor }]}>
            {item.checked && <Text style={pg.tick}>✓</Text>}
          </View>
          <Text style={[pg.itemText, item.checked && pg.itemDone]}>{item.text}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const pg = StyleSheet.create({
  wrap:      { marginBottom: 6 },
  header:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 8 },
  groupName: { fontSize: 12, color: '#888', letterSpacing: 1, marginBottom: 4 },
  bar:       { height: 2, backgroundColor: '#2A2A2A', borderRadius: 1, overflow: 'hidden' },
  barFill:   { height: 2, borderRadius: 1 },
  count:     { fontSize: 11, color: '#444', width: 30, textAlign: 'right' },
  arrow:     { fontSize: 12, color: '#444', width: 14, textAlign: 'center' },
  item:      { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7, paddingLeft: 4 },
  circle:    { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: '#333', alignItems: 'center', justifyContent: 'center' },
  tick:      { fontSize: 10, color: '#0D0D0D', fontWeight: '700' },
  itemText:  { fontSize: 14, color: '#C0BAB0', flex: 1 },
  itemDone:  { textDecorationLine: 'line-through', color: '#444' },
});

// ─── 主屏幕 ───────────────────────────────────────────────────────
export default function MemoScreen({ route, navigation }) {
  const tripId   = route?.params?.tripId   || null;
  const tripName = route?.params?.tripName || null;
  const [memos,        setMemos]        = useState([]);
  const [tab,          setTab]          = useState('packing'); // 'packing' | 'memo'
  const [showAdd,      setShowAdd]      = useState(false);
  const [editingMemo,  setEditingMemo]  = useState(null);
  const [title,        setTitle]        = useState('');
  const [items,        setItems]        = useState([{ id: Date.now(), text: '', checked: false }]);
  const [category,     setCategory]     = useState('note');
  const [showTemplate, setShowTemplate] = useState(false);
  const [filterCat,    setFilterCat]    = useState('all');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(v => {
      const loaded = v ? JSON.parse(v) : [];
      setMemos(loaded);
      // 从旅程进入且该旅程没有打包清单时，自动弹出新建
      if (tripId) {
        const hasTripMemo = loaded.some(m => m.category === 'packing' && m.tripId === tripId);
        if (!hasTripMemo) {
          setCategory('packing');
          setTitle('');
          setItems([{ id: Date.now(), text: '', checked: false }]);
          setEditingMemo(null);
          setTimeout(() => setShowTemplate(true), 300);
        }
      }
    });
  }, []);

  const saveMemos = async (next) => {
    setMemos(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const openNew = (defaultCat = 'note') => {
    setEditingMemo(null);
    setTitle('');
    setItems([{ id: Date.now(), text: '', checked: false }]);
    setCategory(defaultCat);
    setShowAdd(true);
  };

  const openEdit = (memo) => {
    setEditingMemo(memo);
    setTitle(memo.title);
    setItems(memo.items);
    setCategory(memo.category);
    setShowAdd(true);
  };

  const saveMemo = async () => {
    if (!title.trim() && items.every(i => !i.text.trim())) return;
    const validItems = items.filter(i => i.text.trim());
    const now = new Date();
    const timeStr = `${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')}`;

    if (editingMemo) {
      await saveMemos(memos.map(m =>
        m.id === editingMemo.id
          ? { ...m, title: title.trim(), items: validItems, category, updatedAt: timeStr }
          : m
      ));
    } else {
      await saveMemos([{
        id: Date.now(),
        title: title.trim() || '未命名清单',
        items: validItems,
        category,
        tripId: tripId || null,
        createdAt: timeStr,
        updatedAt: timeStr,
      }, ...memos]);
    }
    setShowAdd(false);
  };

  const deleteMemo = (id, titleText) => {
    Alert.alert('删除', `确定删除「${titleText}」？`, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: async () => saveMemos(memos.filter(m => m.id !== id)) },
    ]);
  };

  const toggleItem = async (memoId, itemId) => {
    await saveMemos(memos.map(m =>
      m.id === memoId
        ? { ...m, items: m.items.map(i => i.id === itemId ? { ...i, checked: !i.checked } : i) }
        : m
    ));
  };

  const addItem = () => setItems([...items, { id: Date.now(), text: '', checked: false }]);
  const updateItem = (id, text) => setItems(items.map(i => i.id === id ? { ...i, text } : i));
  const removeItem = (id) => { if (items.length > 1) setItems(items.filter(i => i.id !== id)); };

  const applyTemplate = (key) => {
    const tpl = SMART_PACKING[key];
    if (!tpl) return;
    const allItems = Object.entries(tpl.groups).flatMap(([groupName, list]) =>
      list.map((text, i) => ({ id: Date.now() + Math.random() * 1000 + i, text, checked: false, groupKey: groupName }))
    );
    setItems(allItems);
    setTitle(key === '通用' ? '旅行打包清单' : `${key}旅行打包清单`);
    setCategory('packing');
    setShowTemplate(false);
    setShowAdd(true);
  };

  const getCat    = (key) => CATEGORIES.find(c => c.key === key) || CATEGORIES[5];
  const packMemos = tripId
    ? memos.filter(m => m.category === 'packing' && m.tripId === tripId)
    : memos.filter(m => m.category === 'packing');
  const otherMemos = filterCat === 'all'
    ? memos.filter(m => m.category !== 'packing')
    : memos.filter(m => m.category === filterCat && m.category !== 'packing');

  // ── 打包清单卡片 ──────────────────────────────────────────────
  const PackingCard = ({ memo }) => {
    const total = memo.items.filter(i => !i.isHeader).length;
    const done  = memo.items.filter(i => i.checked && !i.isHeader).length;
    const pct   = total > 0 ? (done / total) * 100 : 0;
    // 找出该清单所有分组key
    const groups = [...new Set(memo.items.map(i => i.groupKey).filter(Boolean))];
    const hasGroups = groups.length > 0;

    return (
      <TouchableOpacity style={s.packCard} onPress={() => openEdit(memo)}
        onLongPress={() => deleteMemo(memo.id, memo.title)} activeOpacity={0.85}>
        {/* 顶部行 */}
        <View style={s.packCardTop}>
          <Text style={s.packCardTitle}>{memo.title}</Text>
          <Text style={s.packCardDate}>{memo.updatedAt}</Text>
        </View>

        {/* 总进度条 */}
        <View style={s.bigBarWrap}>
          <View style={s.bigBarBg}>
            <View style={[s.bigBarFill, { width: `${pct}%` }]} />
          </View>
          <Text style={[s.bigBarText, done === total && total > 0 && { color: '#4ECDC4' }]}>
            {done}/{total} 已备齐
          </Text>
        </View>

        {/* 分组预览 */}
        {hasGroups
          ? groups.slice(0, 3).map(g => {
              const gi = memo.items.filter(i => i.groupKey === g);
              const gc = gi.filter(i => i.checked).length;
              return (
                <View key={g} style={s.groupPreviewRow}>
                  <Text style={s.groupPreviewName}>{g}</Text>
                  <Text style={[s.groupPreviewCount, gc === gi.length && { color: '#4ECDC4' }]}>
                    {gc}/{gi.length}
                  </Text>
                </View>
              );
            })
          : memo.items.slice(0, 3).map(item => (
              <TouchableOpacity key={item.id} style={s.simpleItemRow}
                onPress={() => toggleItem(memo.id, item.id)}>
                <View style={[s.smallCircle, item.checked && { backgroundColor: '#4ECDC4', borderColor: '#4ECDC4' }]}>
                  {item.checked && <Text style={{ fontSize: 8, color: '#0D0D0D', fontWeight: '700' }}>✓</Text>}
                </View>
                <Text style={[s.simpleItemText, item.checked && { color: '#444', textDecorationLine: 'line-through' }]}>
                  {item.text}
                </Text>
              </TouchableOpacity>
            ))
        }
        {groups.length > 3 && (
          <Text style={s.moreGroups}>还有 {groups.length - 3} 个分类 →</Text>
        )}

        {/* 底部：绑定旅程（占位） */}
        <View style={s.packCardFoot}>
          <TouchableOpacity style={[s.bindTripBtn, memo.tripId && {backgroundColor:'#D4AF3720',borderColor:'#D4AF3750'}]} onPress={() => Alert.alert(memo.tripId ? '已绑定旅程' : '绑定旅程', memo.tripId ? `当前已绑定到该旅程的打包清单` : '从旅程页面进入可自动绑定')}>
            <Text style={[s.bindTripText, memo.tripId && {color:'#D4AF37'}]}>{memo.tripId ? '✓ 已绑定旅程' : '🗺️ 绑定旅程'}</Text>
          </TouchableOpacity>
          {done === total && total > 0 && (
            <Text style={s.allDoneBadge}>✅ 已备齐</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // ── 普通备忘录卡片 ────────────────────────────────────────────
  const MemoCard = ({ memo }) => {
    const cat   = getCat(memo.category);
    const total = memo.items.length;
    const done  = memo.items.filter(i => i.checked).length;
    return (
      <TouchableOpacity style={s.memoCard} onPress={() => openEdit(memo)}
        onLongPress={() => deleteMemo(memo.id, memo.title)} activeOpacity={0.85}>
        <View style={s.memoCardHeader}>
          <View style={[s.catBadge, { backgroundColor: cat.color + '20', borderColor: cat.color + '60' }]}>
            <Text style={[s.catBadgeText, { color: cat.color }]}>{cat.label}</Text>
          </View>
          <Text style={s.memoDate}>{memo.updatedAt}</Text>
        </View>
        <Text style={s.memoTitle}>{memo.title}</Text>
        {total > 0 && (
          <View style={s.progressRow}>
            <View style={s.progressBg}>
              <View style={[s.progressFill, { width: `${(done/total)*100}%`, backgroundColor: cat.color }]} />
            </View>
            <Text style={s.progressText}>{done}/{total}</Text>
          </View>
        )}
        {memo.items.slice(0, 3).map(item => (
          <TouchableOpacity key={item.id} style={s.itemPreview}
            onPress={() => toggleItem(memo.id, item.id)}>
            <Text style={[s.itemCheck, item.checked && { color: cat.color }]}>
              {item.checked ? '✓' : '○'}
            </Text>
            <Text style={[s.itemText, item.checked && s.itemTextDone]}>{item.text}</Text>
          </TouchableOpacity>
        ))}
        {total > 3 && <Text style={s.moreText}>还有 {total - 3} 项...</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" />

      {/* ── 页头 ── */}
      {tripId && (
        <TouchableOpacity style={{paddingHorizontal:24,paddingTop:8}} onPress={()=>route?.params && navigation?.goBack?.()}>
          <Text style={{color:'#4ECDC4',fontSize:14}}>← 返回旅程</Text>
        </TouchableOpacity>
      )}
      <View style={s.header}>
        <View>
          <Text style={s.pageTitle}>{tripName ? `${tripName} · 打包` : '行前准备'}</Text>
          <Text style={s.pageSubtitle}>{tripName ? '该旅程的打包清单' : '打包清单 · 备忘录'}</Text>
        </View>
        <TouchableOpacity style={s.newBtn}
          onPress={() => openNew(tab === 'packing' ? 'packing' : 'note')}>
          <Text style={s.newBtnText}>＋ 新建</Text>
        </TouchableOpacity>
      </View>

      {/* ── Tab 切换 ── */}
      <View style={s.tabRow}>
        <TouchableOpacity style={[s.tabBtn, tab === 'packing' && s.tabBtnActive]}
          onPress={() => setTab('packing')}>
          <Text style={[s.tabText, tab === 'packing' && s.tabTextActive]}>🧳 打包清单</Text>
          {packMemos.length > 0 && (
            <View style={[s.tabBadge, tab === 'packing' && { backgroundColor: '#4ECDC4' }]}>
              <Text style={s.tabBadgeText}>{packMemos.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={[s.tabBtn, tab === 'memo' && s.tabBtnActive]}
          onPress={() => setTab('memo')}>
          <Text style={[s.tabText, tab === 'memo' && s.tabTextActive]}>📝 备忘录</Text>
          {otherMemos.length > 0 && (
            <View style={[s.tabBadge, tab === 'memo' && { backgroundColor: '#D4AF37' }]}>
              <Text style={s.tabBadgeText}>{otherMemos.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ── 打包清单 Tab ── */}
      {tab === 'packing' && (
        <ScrollView contentContainerStyle={s.scroll}>
          {/* 智能模板入口 */}
          <TouchableOpacity style={s.templateBanner} onPress={() => { setShowTemplate(true); }}>
            <View>
              <Text style={s.templateBannerTitle}>✨ 智能打包模板</Text>
              <Text style={s.templateBannerSub}>套用模板，进入编辑后保存</Text>
            </View>
            <Text style={s.templateBannerArrow}>→</Text>
          </TouchableOpacity>

          {packMemos.length === 0 ? (
            <View style={s.emptyBox}>
              <Text style={s.emptyEmoji}>🧳</Text>
              <Text style={s.emptyText}>还没有打包清单</Text>
              <Text style={s.emptyHint}>点上方模板快速生成，或手动新建</Text>
            </View>
          ) : (
            packMemos.map(m => <PackingCard key={m.id} memo={m} />)
          )}
        </ScrollView>
      )}

      {/* ── 备忘录 Tab ── */}
      {tab === 'memo' && (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterBar}>
            <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingVertical: 8 }}>
              <TouchableOpacity
                style={[s.filterChip, filterCat === 'all' && s.filterChipActive]}
                onPress={() => setFilterCat('all')}>
                <Text style={[s.filterChipText, filterCat === 'all' && { color: '#D4AF37' }]}>全部</Text>
              </TouchableOpacity>
              {CATEGORIES.filter(c => c.key !== 'packing').map(cat => (
                <TouchableOpacity key={cat.key}
                  style={[s.filterChip, filterCat === cat.key && { borderColor: cat.color, backgroundColor: cat.color + '15' }]}
                  onPress={() => setFilterCat(cat.key)}>
                  <Text style={[s.filterChipText, filterCat === cat.key && { color: cat.color }]}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <ScrollView contentContainerStyle={s.scroll}>
            {otherMemos.length === 0 ? (
              <View style={s.emptyBox}>
                <Text style={s.emptyEmoji}>📝</Text>
                <Text style={s.emptyText}>还没有备忘录</Text>
                <Text style={s.emptyHint}>点击「＋ 新建」开始记录</Text>
              </View>
            ) : (
              otherMemos.map(m => <MemoCard key={m.id} memo={m} />)
            )}
          </ScrollView>
        </>
      )}

      {/* ── 新建/编辑弹窗 ── */}
      <Modal visible={showAdd} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.overlay}>
          <View style={s.sheet}>
            <View style={s.sheetHeader}>
              <Text style={s.sheetTitle}>{editingMemo ? '编辑' : '新建'}</Text>
              <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
                {!editingMemo && (
                  <TouchableOpacity onPress={() => { setShowAdd(false); setTimeout(() => setShowTemplate(true), 200); }}>
                    <Text style={{ color: '#4ECDC4', fontSize: 13 }}>📦 模板</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setShowAdd(false)}>
                  <Text style={s.closeBtn}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 分类 - 打包清单不显示 */}
            {category !== 'packing' && <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity key={cat.key}
                    style={[s.catChip, category === cat.key && { backgroundColor: cat.color + '20', borderColor: cat.color }]}
                    onPress={() => setCategory(cat.key)}>
                    <Text style={[s.catChipText, category === cat.key && { color: cat.color }]}>{cat.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>}

            <TextInput
              style={s.titleInput}
              placeholder="清单标题..."
              placeholderTextColor="#444"
              value={title}
              onChangeText={setTitle}
            />

            {/* 编辑模式：打包清单用分组展示 */}
            {category === 'packing' && editingMemo ? (
              <ScrollView style={{ maxHeight: 320 }} nestedScrollEnabled>
                {[...new Set(items.map(i => i.groupKey).filter(Boolean))].map(g => (
                  <PackingGroup key={g} groupName={g} items={items}
                    memoId={editingMemo?.id} catColor="#4ECDC4"
                    onToggle={(_, itemId) => {
                      setItems(items.map(i => i.id === itemId ? { ...i, checked: !i.checked } : i));
                    }} />
                ))}
                {items.filter(i => !i.groupKey).map((item, idx) => (
                  <View key={item.id} style={s.itemRow}>
                    <Text style={s.itemBullet}>•</Text>
                    <TextInput style={s.itemInput} placeholder={`自定义第 ${idx+1} 项...`}
                      placeholderTextColor="#444" value={item.text}
                      onChangeText={t => updateItem(item.id, t)} multiline />
                    <TouchableOpacity onPress={() => removeItem(item.id)}>
                      <Text style={{ color: '#555', fontSize: 18, padding: 4 }}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity style={s.addItemBtn} onPress={addItem}>
                  <Text style={s.addItemBtnText}>＋ 添加自定义项</Text>
                </TouchableOpacity>
              </ScrollView>
            ) : (
              <ScrollView style={{ maxHeight: 280 }} nestedScrollEnabled>
                {items.map((item, idx) => (
                  <View key={item.id} style={s.itemRow}>
                    <Text style={s.itemBullet}>•</Text>
                    <TextInput style={s.itemInput} placeholder={`第 ${idx+1} 项...`}
                      placeholderTextColor="#444" value={item.text}
                      onChangeText={t => updateItem(item.id, t)} multiline />
                    <TouchableOpacity onPress={() => removeItem(item.id)}>
                      <Text style={{ color: '#555', fontSize: 18, padding: 4 }}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity style={s.addItemBtn} onPress={addItem}>
                  <Text style={s.addItemBtnText}>＋ 添加一项</Text>
                </TouchableOpacity>
              </ScrollView>
            )}

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setShowAdd(false)}>
                <Text style={s.cancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.confirmBtn} onPress={saveMemo}>
                <Text style={s.confirmText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── 模板选择弹窗 ── */}
      <Modal visible={showTemplate} animationType="slide" transparent>
        <View style={s.overlay}>
          <View style={[s.sheet, { paddingBottom: 32 }]}>
            <View style={s.sheetHeader}>
              <View>
                <Text style={s.sheetTitle}>选择目的地模板</Text>
                <Text style={{ fontSize: 12, color: '#555', marginTop: 2 }}>选择模板套用，确认后保存</Text>
              </View>
              <TouchableOpacity onPress={() => setShowTemplate(false)}>
                <Text style={s.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={s.templateGrid}>
                {Object.entries(SMART_PACKING).map(([key, tpl]) => {
                  const totalItems = Object.values(tpl.groups).reduce((a, b) => a + b.length, 0);
                  const groupCount = Object.keys(tpl.groups).length;
                  return (
                    <TouchableOpacity key={key} style={s.templateCard}
                      onPress={() => applyTemplate(key)} activeOpacity={0.8}>
                      <Text style={s.templateEmoji}>{tpl.emoji}</Text>
                      <Text style={s.templateCardTitle}>{key}</Text>
                      <Text style={s.templateCardDesc}>{tpl.desc}</Text>
                      <View style={s.templateCardFoot}>
                        <Text style={s.templateCardStat}>{groupCount} 分类</Text>
                        <Text style={s.templateCardStat}>{totalItems} 项</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── 样式 ──────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#0D0D0D' },

  // 页头
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 24, paddingBottom: 12 },
  pageTitle:   { fontSize: 26, color: '#F0EDE8', fontWeight: '300', letterSpacing: 0.5 },
  pageSubtitle:{ fontSize: 12, color: '#555', marginTop: 4 },
  newBtn:      { backgroundColor: '#4ECDC420', borderWidth: 1, borderColor: '#4ECDC450', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  newBtnText:  { color: '#4ECDC4', fontSize: 13 },

  // Tab
  tabRow:          { flexDirection: 'row', marginHorizontal: 20, marginBottom: 4, backgroundColor: '#161616', borderRadius: 14, padding: 4, borderWidth: 1, borderColor: '#242424' },
  tabBtn:          { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10 },
  tabBtnActive:    { backgroundColor: '#1E1E1E' },
  tabText:         { fontSize: 14, color: '#555' },
  tabTextActive:   { color: '#F0EDE8' },
  tabBadge:        { backgroundColor: '#2A2A2A', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  tabBadgeText:    { fontSize: 10, color: '#0D0D0D', fontWeight: '700' },

  // 模板横幅
  templateBanner:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#4ECDC415', borderWidth: 1, borderColor: '#4ECDC430', borderRadius: 14, padding: 16, marginBottom: 16 },
  templateBannerTitle: { fontSize: 15, color: '#4ECDC4', fontWeight: '400' },
  templateBannerSub:   { fontSize: 12, color: '#4ECDC480', marginTop: 2 },
  templateBannerArrow: { fontSize: 20, color: '#4ECDC4' },

  // 打包卡片
  packCard:         { backgroundColor: '#161616', borderRadius: 18, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: '#242424' },
  packCardTop:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  packCardTitle:    { fontSize: 17, color: '#F0EDE8', fontWeight: '400', flex: 1 },
  packCardDate:     { fontSize: 11, color: '#444', marginLeft: 8 },
  bigBarWrap:       { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  bigBarBg:         { flex: 1, height: 5, backgroundColor: '#2A2A2A', borderRadius: 3, overflow: 'hidden' },
  bigBarFill:       { height: 5, borderRadius: 3, backgroundColor: '#4ECDC4' },
  bigBarText:       { fontSize: 12, color: '#555', width: 64, textAlign: 'right' },
  groupPreviewRow:  { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#1E1E1E' },
  groupPreviewName: { fontSize: 12, color: '#666' },
  groupPreviewCount:{ fontSize: 12, color: '#444' },
  simpleItemRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  smallCircle:      { width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, borderColor: '#333', alignItems: 'center', justifyContent: 'center' },
  simpleItemText:   { fontSize: 13, color: '#888', flex: 1 },
  moreGroups:       { fontSize: 12, color: '#4ECDC460', marginTop: 8 },
  packCardFoot:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#1E1E1E' },
  bindTripBtn:      { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#D4AF3710', borderWidth: 1, borderColor: '#D4AF3730', borderRadius: 10 },
  bindTripText:     { fontSize: 12, color: '#D4AF3790' },
  allDoneBadge:     { fontSize: 12, color: '#4ECDC4' },

  // 普通备忘录卡片
  memoCard:       { backgroundColor: '#161616', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#242424' },
  memoCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  catBadge:       { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  catBadgeText:   { fontSize: 11 },
  memoDate:       { fontSize: 11, color: '#444' },
  memoTitle:      { fontSize: 17, color: '#F0EDE8', fontWeight: '400', marginBottom: 10 },
  progressRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  progressBg:     { flex: 1, height: 4, backgroundColor: '#2A2A2A', borderRadius: 2, overflow: 'hidden' },
  progressFill:   { height: 4, borderRadius: 2 },
  progressText:   { fontSize: 11, color: '#555', width: 32, textAlign: 'right' },
  itemPreview:    { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 3 },
  itemCheck:      { fontSize: 14, color: '#444', width: 16 },
  itemText:       { fontSize: 14, color: '#888', flex: 1 },
  itemTextDone:   { textDecorationLine: 'line-through', color: '#444' },
  moreText:       { fontSize: 12, color: '#444', marginTop: 4 },

  // 筛选栏
  filterBar:      { flexGrow: 0 },
  filterChip:     { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#161616', borderWidth: 1, borderColor: '#242424' },
  filterChipActive:{ borderColor: '#D4AF37', backgroundColor: '#D4AF3715' },
  filterChipText: { fontSize: 13, color: '#666' },

  // 空状态
  scroll:     { padding: 20, paddingBottom: 100 },
  emptyBox:   { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText:  { fontSize: 16, color: '#555' },
  emptyHint:  { fontSize: 13, color: '#333', marginTop: 6 },

  // 弹窗通用
  overlay:     { flex: 1, justifyContent: 'flex-end', backgroundColor: '#000000BB' },
  sheet:       { backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 48, borderTopWidth: 1, borderColor: '#2A2A2A', maxHeight: '92%' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  sheetTitle:  { fontSize: 20, color: '#F0EDE8', fontWeight: '300' },
  closeBtn:    { fontSize: 18, color: '#555' },
  catChip:     { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#2A2A2A' },
  catChipText: { fontSize: 13, color: '#666' },
  titleInput:  { backgroundColor: '#1A1A1A', borderRadius: 12, padding: 14, color: '#F0EDE8', fontSize: 16, marginBottom: 14, borderWidth: 1, borderColor: '#2A2A2A' },
  itemRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  itemBullet:  { color: '#4ECDC4', fontSize: 18, width: 16 },
  itemInput:   { flex: 1, backgroundColor: '#1A1A1A', borderRadius: 10, padding: 10, color: '#F0EDE8', fontSize: 14, borderWidth: 1, borderColor: '#2A2A2A' },
  addItemBtn:  { paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 10, borderStyle: 'dashed', marginTop: 4 },
  addItemBtnText: { color: '#555', fontSize: 14 },
  cancelBtn:   { flex: 1, padding: 16, borderRadius: 14, backgroundColor: '#1A1A1A', alignItems: 'center' },
  cancelText:  { color: '#555', fontSize: 15 },
  confirmBtn:  { flex: 1, padding: 16, borderRadius: 14, backgroundColor: '#4ECDC4', alignItems: 'center' },
  confirmText: { color: '#0D0D0D', fontSize: 15, fontWeight: '700' },

  // 模板网格
  templateGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  templateCard:     { width: '47%', backgroundColor: '#1A1A1A', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#2A2A2A' },
  templateEmoji:    { fontSize: 32, marginBottom: 8 },
  templateCardTitle:{ fontSize: 16, color: '#F0EDE8', fontWeight: '400', marginBottom: 4 },
  templateCardDesc: { fontSize: 11, color: '#555', marginBottom: 10, lineHeight: 16 },
  templateCardFoot: { flexDirection: 'row', gap: 8 },
  templateCardStat: { fontSize: 11, color: '#4ECDC490', backgroundColor: '#4ECDC410', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
});
