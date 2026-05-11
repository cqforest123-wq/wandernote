import React, { useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, Modal, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@wandernote_memos';

const CATEGORIES = [
  { key: 'travel', label: '✈️ 旅行', color: '#D4AF37' },
  { key: 'packing', label: '🧳 打包', color: '#4ECDC4' },
  { key: 'todo', label: '✅ 待办', color: '#6BCB77' },
  { key: 'idea', label: '💡 灵感', color: '#FFB347' },
  { key: 'note', label: '📝 笔记', color: '#9B8EC4' },
  { key: 'other', label: '📌 其他', color: '#888' },
];

const SMART_PACKING = {
  '美国': {
    '📋 证件': ['🛂 护照（有效期6个月以上）', '🪪 中国驾照原件', '📄 驾照英文翻译件', '📋 签证/ESTA确认单', '📋 酒店/行程确认单', '🎫 回程机票'],
    '💰 财务': ['💳 双币信用卡（主驾驶员名下）', '💵 美元现金', '📱 Apple Pay/Google Pay'],
    '📱 电子': ['🔌 美标转换插头', '🔋 充电宝', '📱 美国手机卡/eSIM', '📸 相机', '💾 SD卡/TF卡', '🎧 耳机'],
    '👕 衣物': ['🧥 轻便冲锋衣', '👕 换洗衣物', '👙 泳衣/泳裤', '👟 运动鞋', '🩴 拖鞋', '🧢 帽子'],
    '🧴 日用': ['🧴 洗漱用品', '☀️ 防晒霜SPF50+', '🕶️ 太阳镜', '💊 常用药品', '🩹 创可贴', '📦 行李锁'],
    '🎒 特殊': ['🤿 个人面镜+呼吸管', '🎣 公园年卡/景点票', '🚗 行车记录仪', '🪁 无人机', '📦 真空压缩袋'],
  },
  '日本': {
    '📋 证件': ['🛂 护照', '📋 酒店确认单', '🎫 回程机票'],
    '💰 财务': ['💴 日元现金（日本多处不支持刷卡）', '💳 信用卡', '🪙 IC交通卡/Suica'],
    '📱 电子': ['🔌 日标转换插头', '🔋 充电宝', '📱 日本SIM卡', '📸 相机'],
    '👕 衣物': ['👕 换洗衣物', '🧥 外套（按季节）', '👟 舒适步行鞋', '🧦 干净袜子（进榻榻米）'],
    '🧴 日用': ['🧴 洗漱用品', '💊 常用药品', '🌂 折叠伞', '💊 胃药（日本料理偶尔不适应）'],
    '🎒 特殊': ['🎫 JR Pass（提前购买）', '📱 Google翻译离线包', '🗺️ 离线地图'],
  },
  '冰岛': {
    '📋 证件': ['🛂 护照', '🪪 驾照（租车必备）', '📋 租车确认单', '📋 酒店确认单'],
    '💰 财务': ['💳 Visa/万事达信用卡', '💶 欧元少量现金'],
    '📱 电子': ['🔌 欧标转换插头', '🔋 大容量充电宝', '📸 相机（北极光）', '📷 三脚架', '💾 大容量存储卡'],
    '👕 衣物': ['🧥 防风防水冲锋衣（必备）', '🧣 保暖内衣', '🧤 手套+帽子', '👢 防水登山靴', '🧦 厚羊毛袜'],
    '🧴 日用': ['☀️ 防晒霜（极昼反射强）', '💊 晕车药（山路多）', '💊 感冒药', '🩹 防水创可贴'],
    '🎒 特殊': ['🌌 极光预报App', '🗺️ 离线地图', '⛽ 提前加满油（加油站少）', '🥪 自带干粮（外食贵）'],
  },
  '澳大利亚': {
    '📋 证件': ['🛂 护照', '🪪 驾照', '📋 签证ETA确认', '📋 行程确认单'],
    '💰 财务': ['💳 信用卡', '💵 澳元少量现金'],
    '📱 电子': ['🔌 澳标转换插头', '🔋 充电宝', '📱 澳洲SIM卡'],
    '👕 衣物': ['👕 夏装为主', '🧥 薄外套（室内冷气强）', '👟 运动鞋', '👙 泳衣'],
    '🧴 日用': ['☀️ 防晒霜SPF50+（澳洲紫外线极强）', '🕶️ 偏光太阳镜', '💊 常用药品', '🦟 防虫喷雾'],
    '🎒 特殊': ['🤿 浮潜装备', '🐊 国家公园门票', '🦘 野生动物园票'],
  },
  '通用': {
    '📋 证件': ['🛂 护照（有效期6个月以上）', '📋 签证确认单', '📋 酒店/行程确认单', '🎫 回程机票', '💊 处方药证明（如有）'],
    '💰 财务': ['💳 信用卡（多带一张备用）', '💵 目的地货币现金', '📱 手机支付'],
    '📱 电子': ['🔌 转换插头', '🔋 充电宝（<100Wh）', '📱 当地SIM卡/eSIM', '📸 相机', '💾 备用存储卡'],
    '👕 衣物': ['👕 换洗衣物（天数+1套）', '👙 泳衣', '🧥 外套', '👟 舒适鞋', '🩴 拖鞋'],
    '🧴 日用': ['🧴 洗漱用品', '☀️ 防晒霜', '💊 常用药品', '🩹 创可贴', '🌂 折叠伞'],
    '🎒 特殊': ['🔒 行李锁', '📦 真空压缩袋', '🛍️ 环保购物袋', '🗺️ 离线地图下载'],
  },
};

export default function MemoScreen() {
  const [memos, setMemos] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingMemo, setEditingMemo] = useState(null);
  const [title, setTitle] = useState('');
  const [items, setItems] = useState([{ id: Date.now(), text: '', checked: false }]);
  const [category, setCategory] = useState('note');
  const [filterCat, setFilterCat] = useState('all');
  const [showTemplate, setShowTemplate] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(v => {
      if (v) setMemos(JSON.parse(v));
    });
  }, []);

  const saveMemos = async (newMemos) => {
    setMemos(newMemos);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newMemos));
  };

  const openNew = () => {
    setEditingMemo(null);
    setTitle('');
    setItems([{ id: Date.now(), text: '', checked: false }]);
    setCategory('note');
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
      const updated = memos.map(m => m.id === editingMemo.id
        ? { ...m, title: title.trim(), items: validItems, category, updatedAt: timeStr }
        : m
      );
      await saveMemos(updated);
    } else {
      const newMemo = {
        id: Date.now(),
        title: title.trim() || '未命名清单',
        items: validItems,
        category,
        createdAt: timeStr,
        updatedAt: timeStr,
      };
      await saveMemos([newMemo, ...memos]);
    }
    setShowAdd(false);
  };

  const deleteMemo = (id, titleText) => {
    Alert.alert('删除备忘录', `确定删除「${titleText}」？`, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: async () => {
        await saveMemos(memos.filter(m => m.id !== id));
      }},
    ]);
  };

  const toggleItem = async (memoId, itemId) => {
    const updated = memos.map(m => m.id === memoId
      ? { ...m, items: m.items.map(i => i.id === itemId ? { ...i, checked: !i.checked } : i) }
      : m
    );
    await saveMemos(updated);
  };

  const addItem = () => {
    setItems([...items, { id: Date.now(), text: '', checked: false }]);
  };

  const updateItem = (id, text) => {
    setItems(items.map(i => i.id === id ? { ...i, text } : i));
  };

  const removeItem = (id) => {
    if (items.length <= 1) return;
    setItems(items.filter(i => i.id !== id));
  };

  const applyTemplate = (templateKey, catKey) => {
    const cats = SMART_PACKING[templateKey] || {};
    const allItems = Object.entries(cats).flatMap(([catName, items]) => [
      { id: Date.now() + Math.random(), text: catName, checked: false, isHeader: true },
      ...items.map(text => ({ id: Date.now() + Math.random(), text, checked: false }))
    ]);
    setItems(allItems.length > 0 ? allItems : [{ id: Date.now(), text: '', checked: false }]);
    setTitle(templateKey === '通用' ? '旅行打包清单' : `${templateKey}旅行打包清单`);
    setCategory('packing');
    setShowTemplate(false);
  };

  const filteredMemos = filterCat === 'all' ? memos : memos.filter(m => m.category === filterCat);
  const getCat = (key) => CATEGORIES.find(c => c.key === key) || CATEGORIES[5];

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" />
      <View style={s.header}>
        <View>
          <Text style={s.title}>📋 备忘录</Text>
          <Text style={s.subtitle}>{memos.length} 条记录</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={openNew}>
          <Text style={s.addBtnText}>+ 新建</Text>
        </TouchableOpacity>
      </View>

      {/* 分类筛选 */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterBar}>
        <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingVertical: 8 }}>
          <TouchableOpacity
            style={[s.filterChip, filterCat === 'all' && s.filterChipActive]}
            onPress={() => setFilterCat('all')}>
            <Text style={[s.filterChipText, filterCat === 'all' && { color: '#D4AF37' }]}>全部</Text>
          </TouchableOpacity>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.key}
              style={[s.filterChip, filterCat === cat.key && { borderColor: cat.color, backgroundColor: cat.color + '15' }]}
              onPress={() => setFilterCat(cat.key)}>
              <Text style={[s.filterChipText, filterCat === cat.key && { color: cat.color }]}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <ScrollView contentContainerStyle={s.scroll}>
        {filteredMemos.length === 0 ? (
          <View style={s.emptyBox}>
            <Text style={s.emptyEmoji}>📋</Text>
            <Text style={s.emptyText}>还没有备忘录</Text>
            <Text style={s.emptyHint}>点击「+ 新建」开始记录</Text>
          </View>
        ) : (
          filteredMemos.map(memo => {
            const cat = getCat(memo.category);
            const total = memo.items.length;
            const checked = memo.items.filter(i => i.checked).length;
            return (
              <TouchableOpacity key={memo.id} style={s.memoCard}
                onPress={() => openEdit(memo)}
                onLongPress={() => deleteMemo(memo.id, memo.title)}>
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
                      <View style={[s.progressFill, { width: `${total > 0 ? (checked/total)*100 : 0}%`, backgroundColor: cat.color }]} />
                    </View>
                    <Text style={s.progressText}>{checked}/{total}</Text>
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
          })
        )}
      </ScrollView>

      {/* 新建/编辑弹窗 */}
      <Modal visible={showAdd} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.overlay}>
          <View style={s.sheet}>
            <View style={s.sheetHeader}>
              <Text style={s.sheetTitle}>{editingMemo ? '编辑备忘录' : '新建备忘录'}</Text>
              <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
                {!editingMemo && (
                  <TouchableOpacity onPress={() => setShowTemplate(true)}>
                    <Text style={{ color: '#4ECDC4', fontSize: 13 }}>📦 模板</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setShowAdd(false)}>
                  <Text style={s.closeBtn}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 分类选择 */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity key={cat.key}
                    style={[s.catChip, category === cat.key && { backgroundColor: cat.color + '20', borderColor: cat.color }]}
                    onPress={() => setCategory(cat.key)}>
                    <Text style={[s.catChipText, category === cat.key && { color: cat.color }]}>{cat.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <TextInput
              style={s.titleInput}
              placeholder="清单标题..."
              placeholderTextColor="#444"
              value={title}
              onChangeText={setTitle}
            />

            <ScrollView style={{ maxHeight: 280 }} nestedScrollEnabled>
              {items.map((item, idx) => (
                <View key={item.id} style={s.itemRow}>
                  <Text style={s.itemBullet}>•</Text>
                  <TextInput
                    style={s.itemInput}
                    placeholder={`第 ${idx + 1} 项...`}
                    placeholderTextColor="#444"
                    value={item.text}
                    onChangeText={t => updateItem(item.id, t)}
                    multiline
                  />
                  <TouchableOpacity onPress={() => removeItem(item.id)}>
                    <Text style={{ color: '#555', fontSize: 18, padding: 4 }}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={s.addItemBtn} onPress={addItem}>
                <Text style={s.addItemBtnText}>+ 添加一项</Text>
              </TouchableOpacity>
            </ScrollView>

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

      {/* 模板选择弹窗 */}
      <Modal visible={showTemplate} animationType="fade" transparent>
        <View style={s.overlay}>
          <View style={[s.sheet, { paddingBottom: 24 }]}>
            <View style={s.sheetHeader}>
              <Text style={s.sheetTitle}>选择模板</Text>
              <TouchableOpacity onPress={() => setShowTemplate(false)}>
                <Text style={s.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            {Object.entries(SMART_PACKING).map(([key, cats]) => {
              const totalItems = Object.values(cats).reduce((a,b) => a + b.length, 0);
              const emoji = key==='美国'?'🇺🇸':key==='日本'?'🇯🇵':key==='冰岛'?'🇮🇸':key==='澳大利亚'?'🇦🇺':'🌍';
              return (
                <TouchableOpacity key={key} style={s.templateItem} onPress={() => applyTemplate(key)}>
                  <View>
                    <Text style={s.templateTitle}>{emoji} {key}旅行清单</Text>
                    <Text style={{fontSize:11,color:'#555',marginTop:3}}>{Object.keys(cats).join(' · ')}</Text>
                  </View>
                  <Text style={s.templateCount}>{totalItems} 项</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 24, paddingBottom: 8 },
  title: { fontSize: 26, color: '#F0EDE8', fontWeight: '300' },
  subtitle: { fontSize: 13, color: '#555', marginTop: 4 },
  addBtn: { backgroundColor: '#D4AF3720', borderWidth: 1, borderColor: '#D4AF3750', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  addBtnText: { color: '#D4AF37', fontSize: 13 },
  filterBar: { flexGrow: 0 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#161616', borderWidth: 1, borderColor: '#242424' },
  filterChipActive: { borderColor: '#D4AF37', backgroundColor: '#D4AF3715' },
  filterChipText: { fontSize: 13, color: '#666' },
  scroll: { padding: 20, paddingBottom: 100 },
  emptyBox: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: '#555' },
  emptyHint: { fontSize: 13, color: '#333', marginTop: 6 },
  memoCard: { backgroundColor: '#161616', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#242424' },
  memoCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  catBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  catBadgeText: { fontSize: 11 },
  memoDate: { fontSize: 11, color: '#444' },
  memoTitle: { fontSize: 17, color: '#F0EDE8', fontWeight: '400', marginBottom: 10 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  progressBg: { flex: 1, height: 4, backgroundColor: '#2A2A2A', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 4, borderRadius: 2 },
  progressText: { fontSize: 11, color: '#555', width: 32, textAlign: 'right' },
  itemPreview: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 3 },
  itemCheck: { fontSize: 14, color: '#444', width: 16 },
  itemText: { fontSize: 14, color: '#888', flex: 1 },
  itemTextDone: { textDecorationLine: 'line-through', color: '#444' },
  moreText: { fontSize: 12, color: '#444', marginTop: 4 },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#000000BB' },
  sheet: { backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 48, borderTopWidth: 1, borderColor: '#2A2A2A', maxHeight: '90%' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 20, color: '#F0EDE8', fontWeight: '300' },
  closeBtn: { fontSize: 18, color: '#555' },
  catChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#2A2A2A' },
  catChipText: { fontSize: 13, color: '#666' },
  titleInput: { backgroundColor: '#1A1A1A', borderRadius: 12, padding: 14, color: '#F0EDE8', fontSize: 16, marginBottom: 14, borderWidth: 1, borderColor: '#2A2A2A' },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  itemBullet: { color: '#D4AF37', fontSize: 18, width: 16 },
  itemInput: { flex: 1, backgroundColor: '#1A1A1A', borderRadius: 10, padding: 10, color: '#F0EDE8', fontSize: 14, borderWidth: 1, borderColor: '#2A2A2A' },
  addItemBtn: { paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 10, borderStyle: 'dashed', marginTop: 4 },
  addItemBtnText: { color: '#555', fontSize: 14 },
  cancelBtn: { flex: 1, padding: 16, borderRadius: 14, backgroundColor: '#1A1A1A', alignItems: 'center' },
  cancelText: { color: '#555', fontSize: 15 },
  confirmBtn: { flex: 1, padding: 16, borderRadius: 14, backgroundColor: '#D4AF37', alignItems: 'center' },
  confirmText: { color: '#0D0D0D', fontSize: 15, fontWeight: '700' },
  templateItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1A1A1A' },
  templateTitle: { fontSize: 16, color: '#F0EDE8' },
  itemHeaderRow: { paddingVertical: 8, paddingTop: 12 },
  itemHeaderText: { fontSize: 12, color: '#D4AF37', letterSpacing: 2, textTransform: 'uppercase' },
  templateCount: { fontSize: 13, color: '#555' },
});
