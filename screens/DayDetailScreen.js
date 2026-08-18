import React, { useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, Modal, KeyboardAvoidingView, Platform, Image, Alert, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { createPhoto, createExpense, EXPENSE_CATEGORIES } from '../lib/models';
import { parseExifCoords, parseExifDate } from '../lib/tripFromPhotos';
import { attachPhotoLocations } from '../lib/photoLocation';
import {
  COMMON_CURRENCIES,
  convert,
  formatMoney,
  getHomeCurrency,
  loadRates,
  sumExpenses,
} from '../lib/currency';

const { width } = Dimensions.get('window');
const PHOTO_SIZE = (width - 48 - 8) / 3;

const TAGS = ['food','scenery','encounter','adventure','stay','transport','shopping','feeling'];
const TAG_LABEL_KEYS = {
  food: 'day_tag_food',
  scenery: 'day_tag_scenery',
  encounter: 'day_tag_encounter',
  adventure: 'day_tag_adventure',
  stay: 'day_tag_stay',
  transport: 'day_tag_transport',
  shopping: 'day_tag_shopping',
  feeling: 'day_tag_feeling',
};
const LEGACY_TAG_MAP = {
  '美食': 'food',
  '风景': 'scenery',
  '邂逅': 'encounter',
  '探险': 'adventure',
  '住宿': 'stay',
  '交通': 'transport',
  '购物': 'shopping',
  '感受': 'feeling',
};
const TAG_COLORS = {
  food: '#FF8C69',
  scenery: '#6BCB77',
  encounter: '#9B8EC4',
  adventure: '#5BC0BE',
  stay: '#FFB347',
  transport: '#64B5F6',
  shopping: '#F06292',
  feeling: '#A8D8EA',
};

function normalizeTag(tag) {
  return LEGACY_TAG_MAP[tag] || tag || 'feeling';
}

const EXPENSE_CATEGORY_LABEL_KEYS = {
  food: 'expense_cat_food',
  transport: 'expense_cat_transport',
  stay: 'expense_cat_stay',
  ticket: 'expense_cat_ticket',
  shopping: 'expense_cat_shopping',
  other: 'expense_cat_other',
};
const EXPENSE_CATEGORY_ICONS = {
  food: '🍜',
  transport: '🚇',
  stay: '🏨',
  ticket: '🎫',
  shopping: '🛍',
  other: '•',
};

export default function DayDetailScreen({ route, navigation, trips, setTrips }) {
  const { tripId, dayDate } = route.params;
  const trip = trips.find(t=>t.id===tripId);
  const day = trip?.days.find(d=>d.date===dayDate);

  const { t } = useTranslation();
  const [showMemoModal, setShowMemoModal] = useState(false);
  const [editingMemo, setEditingMemo] = useState(null); // null=new, object=edit
  const [memoText, setMemoText] = useState('');
  const [selectedTag, setSelectedTag] = useState('feeling');
  const [previewPhoto, setPreviewPhoto] = useState(null);

  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCurrency, setExpenseCurrency] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('food');
  const [expenseNote, setExpenseNote] = useState('');
  const [homeCurrency, setHomeCurrencyState] = useState('');
  const [rates, setRates] = useState(null);

  useEffect(() => {
    let cancelled = false;

    getHomeCurrency().then(code => {
      if (!cancelled) {
        setHomeCurrencyState(code);
        setExpenseCurrency(prev => prev || code);
      }
    });

    // Missing rates are not an error: the UI just shows original currencies.
    loadRates().then(result => {
      if (!cancelled) {
        setRates(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!trip||!day) return null;

  const sortedDays = [...trip.days].sort((a,b)=>a.date.localeCompare(b.date));
  const dayIndex = sortedDays.findIndex(d=>d.date===dayDate)+1;

  const updateDay = (updater) => setTrips(prev=>prev.map(t=>t.id===tripId?{...t,days:t.days.map(d=>d.date===dayDate?updater(d):d)}:t));

  const openNewMemo = () => {
    setEditingMemo(null);
    setMemoText('');
    setSelectedTag('feeling');
    setShowMemoModal(true);
  };

  const openEditMemo = (memo) => {
    setEditingMemo(memo);
    setMemoText(memo.text);
    setSelectedTag(normalizeTag(memo.tag));
    setShowMemoModal(true);
  };

  const saveMemo = () => {
    if (!memoText.trim()) return;
    const now = new Date();
    const pad = n=>String(n).padStart(2,'0');
    if (editingMemo) {
      // 编辑模式
      updateDay(d=>({...d,memos:d.memos.map(m=>m.id===editingMemo.id?{...m,text:memoText.trim(),tag:selectedTag}:m)}));
    } else {
      // 新增模式
      updateDay(d=>({...d,memos:[...d.memos,{id:Date.now(),text:memoText.trim(),tag:selectedTag,time:`${pad(now.getHours())}:${pad(now.getMinutes())}`}]}));
    }
    setShowMemoModal(false);
  };

  const deleteMemo = (memoId) => {
    Alert.alert(t('day_delete_memo'), t('alert_delete_memo_confirm'),[
      {text:t('cancel'),style:'cancel'},
      {text:t('delete'),style:'destructive',onPress:()=>{
        updateDay(d=>({...d,memos:d.memos.filter(m=>m.id!==memoId)}));
        setShowMemoModal(false);
      }},
    ]);
  };


  const pickPhotos = async () => {
    const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status!=='granted') { Alert.alert(t('alert_need_permission'), t('alert_permission_album')); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 20,
      // Needed for the map footprint. Nothing leaves the device — the
      // coordinates are only stored alongside the photo.
      exif: true,
    });
    if (!result.canceled) {
      // Same PHPicker limitation as the trip importer: recover coordinates from
      // the library when we already have access, but never prompt for it here.
      const assets = await attachPhotoLocations(result.assets);
      const newPhotos = assets.map(a => createPhoto({
        uri: a.uri,
        coords: parseExifCoords(a.exif),
        takenAt: parseExifDate(a.exif),
      }));
      updateDay(d=>({...d,photos:[...(d.photos||[]),...newPhotos]}));
    }
  };

  const takePhoto = async () => {
    const {status} = await ImagePicker.requestCameraPermissionsAsync();
    if (status!=='granted') { Alert.alert(t('alert_need_permission'), t('alert_permission_camera')); return; }
    const result = await ImagePicker.launchCameraAsync({quality:0.8});
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      updateDay(d=>({...d,photos:[...(d.photos||[]),createPhoto({ uri })]}));
    }
  };

  const deletePhoto = (photoId) => {
    Alert.alert(t('alert_delete_photo'), t('alert_delete_photo_confirm'),[
      {text:t('cancel'),style:'cancel'},
      {text:t('delete'),style:'destructive',onPress:()=>{
        updateDay(d=>({...d,photos:d.photos.filter(p=>p.id!==photoId)}));
        setPreviewPhoto(null);
      }},
    ]);
  };

  const showPhotoOptions = () => Alert.alert(t('day_photo_source'), t('day_photo_source_subtitle'),[
    {text:t('day_photo_album'),onPress:pickPhotos},
    {text:t('day_photo_camera'),onPress:takePhoto},
    {text:t('cancel'),style:'cancel'},
  ]);

  const photos = day.photos||[];
  const expenses = day.expenses||[];
  const hasContent = day.memos.length>0||photos.length>0||expenses.length>0;

  const dayTotal = sumExpenses(expenses, homeCurrency, rates);

  const openNewExpense = () => {
    setEditingExpense(null);
    setExpenseAmount('');
    setExpenseCurrency(homeCurrency);
    setExpenseCategory('food');
    setExpenseNote('');
    setShowExpenseModal(true);
  };

  const openEditExpense = (expense) => {
    setEditingExpense(expense);
    setExpenseAmount(String(expense.amount ?? ''));
    setExpenseCurrency(expense.currency || homeCurrency);
    setExpenseCategory(expense.category || 'other');
    setExpenseNote(expense.note || '');
    setShowExpenseModal(true);
  };

  const saveExpense = () => {
    const amount = Number(String(expenseAmount).replace(/,/g, ''));

    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert('', t('expense_invalid_amount'));
      return;
    }

    if (editingExpense) {
      updateDay(d => ({
        ...d,
        expenses: (d.expenses||[]).map(e => e.id===editingExpense.id
          ? {...e, amount, currency:expenseCurrency, category:expenseCategory, note:expenseNote.trim()}
          : e),
      }));
    } else {
      const expense = createExpense({
        amount,
        currency: expenseCurrency,
        category: expenseCategory,
        note: expenseNote,
      });
      updateDay(d => ({...d, expenses:[...(d.expenses||[]), expense]}));
    }

    setShowExpenseModal(false);
  };

  const deleteExpense = (expense) => Alert.alert(
    t('expense_delete_title'),
    t('expense_delete_message'),
    [
      {text:t('cancel'),style:'cancel'},
      {text:t('delete'),style:'destructive',onPress:()=>{
        updateDay(d=>({...d,expenses:(d.expenses||[]).filter(e=>e.id!==expense.id)}));
        setShowExpenseModal(false);
      }},
    ]
  );

  /** Home-currency equivalent, or null when no rate can back it up. */
  const convertedText = (expense) => {
    if (expense.currency === homeCurrency) {
      return null;
    }

    const value = convert(expense.amount, expense.currency, homeCurrency, rates);

    return value === null ? null : `≈ ${formatMoney(value, homeCurrency)}`;
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" />
      <ScrollView contentContainerStyle={s.scroll}>
        <TouchableOpacity onPress={()=>navigation.goBack()} style={s.backRow}>
          <Text style={s.backText}>← {trip.city}</Text>
        </TouchableOpacity>

        <View style={s.dayHeader}>
          <View>
            <Text style={s.dayNum}>DAY {dayIndex}</Text>
            <Text style={s.dayDate}>{dayDate}</Text>
            <Text style={s.dayWeek}>{day.weekDay}</Text>
          </View>
          <View style={s.dayActions}>
            <TouchableOpacity style={s.actionBtn} onPress={openNewMemo}>
              <Text style={s.actionBtnText}>{`📝 ${t('day_memo')}`}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.actionBtn,{borderColor:'#4ECDC450',backgroundColor:'#4ECDC415'}]} onPress={showPhotoOptions}>
              <Text style={[s.actionBtnText,{color:'#4ECDC4'}]}>{`📸 ${t('stat_photos')}`}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.actionBtn,{borderColor:'#D4AF3750',backgroundColor:'#D4AF3715'}]} onPress={openNewExpense}>
              <Text style={[s.actionBtnText,{color:'#D4AF37'}]}>{`💰 ${t('expense_add')}`}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {!hasContent ? (
          <View style={s.emptyBox}>
            <View style={s.emptyCard}>
            <Text style={s.emptyEmoji}>✏️</Text>
            <Text style={s.emptyTitle}>{t('day_empty_title')}</Text>
            <Text style={s.emptyText}>{t('day_empty_text')}</Text>
            </View>
            <View style={s.emptyBtns}>
              <TouchableOpacity style={s.emptyBtn} onPress={openNewMemo}><Text style={s.emptyBtnText}>{`📝 ${t('day_write_memo')}`}</Text></TouchableOpacity>
              <TouchableOpacity style={[s.emptyBtn,{borderColor:'#4ECDC450',backgroundColor:'#4ECDC415'}]} onPress={showPhotoOptions}><Text style={[s.emptyBtnText,{color:'#4ECDC4'}]}>{`📸 ${t('day_upload_photo')}`}</Text></TouchableOpacity>
              <TouchableOpacity style={[s.emptyBtn,{borderColor:'#D4AF3750',backgroundColor:'#D4AF3715'}]} onPress={openNewExpense}><Text style={[s.emptyBtnText,{color:'#D4AF37'}]}>{`💰 ${t('expense_add')}`}</Text></TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            {photos.length>0 && (
              <>
                <Text style={s.sectionTitle}>{t('stat_photos')} ({photos.length})</Text>
                <View style={s.photoGrid}>
                  {photos.map((photo,index)=>(
                    <TouchableOpacity key={`photo_${photo.id}_${index}`} onPress={()=>setPreviewPhoto(photo)} onLongPress={()=>deletePhoto(photo.id)}>
                      <Image source={{uri:photo.uri}} style={s.photoThumb} resizeMode="cover"/>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity style={s.addPhotoBtn} onPress={showPhotoOptions}>
                    <Text style={s.addPhotoBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {expenses.length>0 && (
              <>
                <View style={s.expenseHeader}>
                  <Text style={s.sectionTitle}>{t('expense_section')} ({expenses.length})</Text>
                  <View style={{alignItems:'flex-end'}}>
                    <Text style={s.expenseTotal}>{formatMoney(dayTotal.total, homeCurrency)}</Text>
                    {/* Never let a partial total masquerade as the full one. */}
                    {dayTotal.unconvertible.length>0 && (
                      <Text style={s.expenseWarn}>{t('expense_partial_total')}</Text>
                    )}
                    {rates?.stale && dayTotal.unconvertible.length===0 && (
                      <Text style={s.expenseWarn}>{t('expense_stale_rate')}</Text>
                    )}
                  </View>
                </View>
                {expenses.map(expense=>(
                  <TouchableOpacity key={String(expense.id)} style={s.expenseCard} onPress={()=>openEditExpense(expense)} activeOpacity={0.8}>
                    <Text style={s.expenseIcon}>{EXPENSE_CATEGORY_ICONS[expense.category]||'•'}</Text>
                    <View style={{flex:1}}>
                      <Text style={s.expenseCat}>{t(EXPENSE_CATEGORY_LABEL_KEYS[expense.category]||'expense_cat_other')}</Text>
                      {!!expense.note && <Text style={s.expenseNote} numberOfLines={1}>{expense.note}</Text>}
                    </View>
                    <View style={{alignItems:'flex-end'}}>
                      <Text style={s.expenseAmount}>{formatMoney(expense.amount, expense.currency)}</Text>
                      {!!convertedText(expense) && <Text style={s.expenseConverted}>{convertedText(expense)}</Text>}
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            )}

            {day.memos.length>0 && (
              <>
                <Text style={s.sectionTitle}>{t('day_travel_memos')} ({day.memos.length})</Text>
                {day.memos.map(memo=>(
                  <TouchableOpacity key={String(memo.id)} style={s.memoCard} onPress={()=>openEditMemo(memo)} activeOpacity={0.8}>
                    <View style={s.memoTop}>
                      <View style={[s.tagBadge,{backgroundColor:`${TAG_COLORS[normalizeTag(memo.tag)]||'#888'}20`,borderColor:`${TAG_COLORS[normalizeTag(memo.tag)]||'#888'}50`}]}>
                        <Text style={[s.tagText,{color:TAG_COLORS[normalizeTag(memo.tag)]||'#888'}]}>{t(TAG_LABEL_KEYS[normalizeTag(memo.tag)] || 'day_tag_feeling')}</Text>
                      </View>
                      <View style={{flexDirection:'row',gap:8,alignItems:'center'}}>
                        <Text style={s.memoTime}>{memo.time}</Text>
                        <Text style={s.editHint}>{t('tap_to_edit')}</Text>
                      </View>
                    </View>
                    <Text style={s.memoText}>{memo.text}</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* 照片全屏预览 */}
      <Modal visible={!!previewPhoto} transparent animationType="fade">
        <View style={s.photoOverlay}>
          <TouchableOpacity style={s.photoClose} onPress={()=>setPreviewPhoto(null)}>
            <Text style={s.photoCloseText}>✕</Text>
          </TouchableOpacity>
          {previewPhoto && <Image source={{uri:previewPhoto.uri}} style={s.photoFull} resizeMode="contain"/>}
          <TouchableOpacity style={s.photoDeleteBtn} onPress={()=>deletePhoto(previewPhoto?.id)}>
            <Text style={s.photoDeleteText}>{`🗑 ${t('day_delete_photo')}`}</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* 新增/编辑感言弹窗 */}
      <Modal visible={showMemoModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={s.overlay}>
          <View style={s.sheet}>
            <View style={s.sheetHeader}>
              <Text style={s.sheetTitle}>{editingMemo?t('day_edit_memo'):t('day_add_memo')}</Text>
              <View style={{flexDirection:'row',gap:16}}>
                {editingMemo && (
                  <TouchableOpacity onPress={()=>deleteMemo(editingMemo.id)}>
                    <Text style={{color:'#FF6B6B',fontSize:14}}>{t('delete')}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={()=>setShowMemoModal(false)}><Text style={s.closeBtn}>✕</Text></TouchableOpacity>
              </View>
            </View>
            <Text style={s.inputLabel}>{t('day_label_tag')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:16}}>
              <View style={{flexDirection:'row',gap:8}}>
                {TAGS.map(tag=>(
                  <TouchableOpacity key={tag} onPress={()=>setSelectedTag(tag)} style={[s.tagChip,selectedTag===tag&&{backgroundColor:`${TAG_COLORS[tag]}20`,borderColor:`${TAG_COLORS[tag]}60`}]}>
                    <Text style={[s.tagChipText,selectedTag===tag&&{color:TAG_COLORS[tag]}]}>{t(TAG_LABEL_KEYS[tag])}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <Text style={s.inputLabel}>{t('day_label_content')}</Text>
            <TextInput style={[s.input,{height:140,textAlignVertical:'top'}]} placeholder={t("day_memo_placeholder")} placeholderTextColor="#444" multiline value={memoText} onChangeText={setMemoText} autoFocus/>
            <View style={{flexDirection:'row',gap:12}}>
              <TouchableOpacity style={s.cancelBtn} onPress={()=>setShowMemoModal(false)}><Text style={s.cancelText}>{t('cancel')}</Text></TouchableOpacity>
              <TouchableOpacity style={s.confirmBtn} onPress={saveMemo}><Text style={s.confirmText}>{editingMemo?t('save'):t('save')}</Text></TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 记一笔 */}
      <Modal visible={showExpenseModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':undefined} style={s.modalWrap}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>{editingExpense?t('expense_edit_title'):t('expense_add')}</Text>

            <Text style={s.inputLabel}>{t('expense_label_amount')}</Text>
            <TextInput
              style={s.input}
              placeholder="0"
              placeholderTextColor="#444"
              keyboardType="decimal-pad"
              value={expenseAmount}
              onChangeText={setExpenseAmount}
              autoFocus
            />

            <Text style={s.inputLabel}>{t('expense_label_currency')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:16}}>
              {COMMON_CURRENCIES.map(item=>(
                <TouchableOpacity
                  key={item.code}
                  style={[s.chip, expenseCurrency===item.code&&s.chipActive]}
                  onPress={()=>setExpenseCurrency(item.code)}>
                  <Text style={[s.chipText, expenseCurrency===item.code&&s.chipTextActive]}>{item.code}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={s.inputLabel}>{t('expense_label_category')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:16}}>
              {EXPENSE_CATEGORIES.map(cat=>(
                <TouchableOpacity
                  key={cat}
                  style={[s.chip, expenseCategory===cat&&s.chipActive]}
                  onPress={()=>setExpenseCategory(cat)}>
                  <Text style={[s.chipText, expenseCategory===cat&&s.chipTextActive]}>
                    {`${EXPENSE_CATEGORY_ICONS[cat]} ${t(EXPENSE_CATEGORY_LABEL_KEYS[cat])}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={s.inputLabel}>{t('expense_label_note')}</Text>
            <TextInput
              style={s.input}
              placeholder={t('expense_note_placeholder')}
              placeholderTextColor="#444"
              value={expenseNote}
              onChangeText={setExpenseNote}
            />

            <View style={{flexDirection:'row',gap:12}}>
              <TouchableOpacity style={s.cancelBtn} onPress={()=>setShowExpenseModal(false)}><Text style={s.cancelText}>{t('cancel')}</Text></TouchableOpacity>
              <TouchableOpacity style={s.confirmBtn} onPress={saveExpense}><Text style={s.confirmText}>{t('save')}</Text></TouchableOpacity>
            </View>

            {!!editingExpense && (
              <TouchableOpacity style={{marginTop:14,alignItems:'center'}} onPress={()=>deleteExpense(editingExpense)}>
                <Text style={{color:'#C86B6B',fontSize:13}}>{t('expense_delete_title')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:{flex:1,backgroundColor:'#0D0D0D'},
  scroll:{padding:24,paddingBottom:100},
  backRow:{marginBottom:20},
  backText:{color:'#D4AF37',fontSize:15},
  dayHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',marginBottom:24},
  dayNum:{fontSize:11,color:'#D4AF37',letterSpacing:3},
  dayDate:{fontSize:24,color:'#F0EDE8',fontWeight:'300',marginTop:4},
  dayWeek:{fontSize:14,color:'#555',marginTop:4},
  dayActions:{gap:8,alignItems:'flex-end'},
  actionBtn:{borderWidth:1,borderColor:'#D4AF3750',backgroundColor:'#D4AF3715',borderRadius:20,paddingHorizontal:14,paddingVertical:7},
  actionBtnText:{color:'#D4AF37',fontSize:13},
  emptyBox:{alignItems:'center',paddingVertical:24,paddingHorizontal:8},
  emptyCard:{borderWidth:1,borderColor:'#2A2A2A',borderStyle:'dashed',borderRadius:20,padding:32,alignItems:'center',width:'100%',marginBottom:20},
  emptyEmoji:{fontSize:52,marginBottom:16},
  emptyTitle:{fontSize:18,color:'#F0EDE8',fontWeight:'300',marginBottom:8},
  emptyText:{fontSize:14,color:'#444',textAlign:'center',lineHeight:20,marginBottom:20},
  emptyBtns:{flexDirection:'row',gap:10},
  emptyBtn:{borderWidth:1,borderColor:'#D4AF3750',backgroundColor:'#D4AF3715',borderRadius:20,paddingHorizontal:16,paddingVertical:10},
  emptyBtnText:{color:'#D4AF37',fontSize:14},
  sectionTitle:{fontSize:11,color:'#555',letterSpacing:3,textTransform:'uppercase',marginBottom:12},
  expenseHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start'},
  expenseTotal:{fontSize:20,color:'#D4AF37',fontWeight:'300'},
  expenseWarn:{fontSize:10,color:'#8A7B4A',marginTop:2},
  expenseCard:{flexDirection:'row',alignItems:'center',gap:12,backgroundColor:'#161616',borderRadius:14,padding:14,marginBottom:8,borderWidth:1,borderColor:'#2A2A2A'},
  expenseIcon:{fontSize:20},
  expenseCat:{fontSize:14,color:'#C8C4BC'},
  expenseNote:{fontSize:12,color:'#555',marginTop:2},
  expenseAmount:{fontSize:16,color:'#F0EDE8',fontWeight:'300'},
  expenseConverted:{fontSize:11,color:'#555',marginTop:2},
  chip:{borderWidth:1,borderColor:'#2A2A2A',borderRadius:16,paddingHorizontal:14,paddingVertical:8,marginRight:8},
  chipActive:{borderColor:'#D4AF3780',backgroundColor:'#D4AF3720'},
  chipText:{fontSize:13,color:'#666'},
  chipTextActive:{color:'#D4AF37'},
  photoGrid:{flexDirection:'row',flexWrap:'wrap',gap:4,marginBottom:24},
  photoThumb:{width:PHOTO_SIZE,height:PHOTO_SIZE,borderRadius:8,backgroundColor:'#1A1A1A'},
  addPhotoBtn:{width:PHOTO_SIZE,height:PHOTO_SIZE,borderRadius:8,backgroundColor:'#1A1A1A',borderWidth:1,borderColor:'#2A2A2A',alignItems:'center',justifyContent:'center'},
  addPhotoBtnText:{fontSize:28,color:'#444'},
  memoCard:{backgroundColor:'#161616',borderRadius:14,padding:16,marginBottom:10,borderWidth:1,borderColor:'#2A2A2A'},
  memoTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:10},
  tagBadge:{paddingHorizontal:10,paddingVertical:4,borderRadius:8,borderWidth:1},
  tagText:{fontSize:11,letterSpacing:0.5},
  memoTime:{fontSize:11,color:'#444'},
  editHint:{fontSize:10,color:'#444'},
  memoText:{fontSize:15,color:'#C8C4BC',lineHeight:22},
  photoOverlay:{flex:1,backgroundColor:'#000000EE',justifyContent:'center',alignItems:'center'},
  photoClose:{position:'absolute',top:60,right:24,zIndex:10,padding:8},
  photoCloseText:{color:'#FFF',fontSize:24},
  photoFull:{width:'100%',height:'80%'},
  photoDeleteBtn:{position:'absolute',bottom:60,backgroundColor:'#FF4444',paddingHorizontal:24,paddingVertical:12,borderRadius:24},
  photoDeleteText:{color:'#FFF',fontSize:15},
  overlay:{flex:1,justifyContent:'flex-end',backgroundColor:'#000000BB'},
  sheet:{backgroundColor:'#111',borderTopLeftRadius:24,borderTopRightRadius:24,padding:24,paddingBottom:48,borderTopWidth:1,borderColor:'#2A2A2A'},
  sheetHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:20},
  sheetTitle:{fontSize:20,color:'#F0EDE8',fontWeight:'300'},
  closeBtn:{fontSize:18,color:'#555'},
  inputLabel:{fontSize:11,color:'#555',letterSpacing:2,textTransform:'uppercase',marginBottom:10},
  tagChip:{paddingHorizontal:14,paddingVertical:8,borderRadius:20,backgroundColor:'#1A1A1A',borderWidth:1,borderColor:'#2A2A2A'},
  tagChipText:{fontSize:14,color:'#666'},
  input:{backgroundColor:'#1A1A1A',borderRadius:12,padding:14,color:'#F0EDE8',fontSize:15,marginBottom:20,borderWidth:1,borderColor:'#2A2A2A'},
  cancelBtn:{flex:1,padding:16,borderRadius:14,backgroundColor:'#1A1A1A',alignItems:'center'},
  cancelText:{color:'#555',fontSize:15},
  confirmBtn:{flex:1,padding:16,borderRadius:14,backgroundColor:'#D4AF37',alignItems:'center'},
  confirmText:{color:'#0D0D0D',fontSize:15,fontWeight:'700'},
});
