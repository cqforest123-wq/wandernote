import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, Modal, KeyboardAvoidingView, Platform, Image, Alert, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');
const PHOTO_SIZE = (width - 48 - 8) / 3;

const TAGS = ['美食','风景','邂逅','探险','住宿','交通','购物','感受'];
const TAG_COLORS = {'美食':'#FF8C69','风景':'#6BCB77','邂逅':'#9B8EC4','探险':'#5BC0BE','住宿':'#FFB347','交通':'#64B5F6','购物':'#F06292','感受':'#A8D8EA'};

export default function DayDetailScreen({ route, navigation, trips, setTrips }) {
  const { tripId, dayDate } = route.params;
  const trip = trips.find(t=>t.id===tripId);
  const day = trip?.days.find(d=>d.date===dayDate);

  const { t } = useTranslation();
  const [showMemoModal, setShowMemoModal] = useState(false);
  const [editingMemo, setEditingMemo] = useState(null); // null=新增, object=编辑
  const [memoText, setMemoText] = useState('');
  const [selectedTag, setSelectedTag] = useState('感受');
  const [previewPhoto, setPreviewPhoto] = useState(null);

  if (!trip||!day) return null;

  const sortedDays = [...trip.days].sort((a,b)=>a.date.localeCompare(b.date));
  const dayIndex = sortedDays.findIndex(d=>d.date===dayDate)+1;

  const updateDay = (updater) => setTrips(trips.map(t=>t.id===tripId?{...t,days:t.days.map(d=>d.date===dayDate?updater(d):d)}:t));

  const openNewMemo = () => {
    setEditingMemo(null);
    setMemoText('');
    setSelectedTag('感受');
    setShowMemoModal(true);
  };

  const openEditMemo = (memo) => {
    setEditingMemo(memo);
    setMemoText(memo.text);
    setSelectedTag(memo.tag);
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
    Alert.alert(t('day_delete_memo'),'确定删除这条感言？',[
      {text:t('cancel'),style:'cancel'},
      {text:'删除',style:'destructive',onPress:()=>{
        updateDay(d=>({...d,memos:d.memos.filter(m=>m.id!==memoId)}));
        setShowMemoModal(false);
      }},
    ]);
  };

  const SERVER = 'http://137.184.6.106:3000';

  const uploadToServer = async (uri, tripId) => {
    try {
      const formData = new FormData();
      const filename = uri.split('/').pop();
      const ext = filename.split('.').pop().toLowerCase();
      const type = ext === 'mp4' || ext === 'mov' ? `video/${ext}` : `image/${ext}`;
      formData.append('file', { uri, name: filename, type });
      const res = await fetch(`${SERVER}/upload/${tripId}`, {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const data = await res.json();
      return data.url;
    } catch (e) {
      console.log('上传失败，使用本地:', e.message);
      return null;
    }
  };

  const pickPhotos = async () => {
    const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status!=='granted') { Alert.alert('需要权限','请允许访问相册'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 20,
    });
    if (!result.canceled) {
      const newPhotos = await Promise.all(result.assets.map(async a => {
        const serverUrl = await uploadToServer(a.uri, tripId);
        return { id: Date.now()+Math.random(), uri: a.uri, serverUrl };
      }));
      updateDay(d=>({...d,photos:[...(d.photos||[]),...newPhotos]}));
    }
  };

  const takePhoto = async () => {
    const {status} = await ImagePicker.requestCameraPermissionsAsync();
    if (status!=='granted') { Alert.alert('需要权限','请允许访问相机'); return; }
    const result = await ImagePicker.launchCameraAsync({quality:0.8});
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      const serverUrl = await uploadToServer(uri, tripId);
      updateDay(d=>({...d,photos:[...(d.photos||[]),{id:Date.now(),uri,serverUrl}]}));
    }
  };

  const deletePhoto = (photoId) => {
    Alert.alert('删除照片','确定删除这张照片？',[
      {text:t('cancel'),style:'cancel'},
      {text:'删除',style:'destructive',onPress:()=>{
        updateDay(d=>({...d,photos:d.photos.filter(p=>p.id!==photoId)}));
        setPreviewPhoto(null);
      }},
    ]);
  };

  const pickVideos = async () => {
    const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status!=='granted') { Alert.alert('需要权限','请允许访问相册'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsMultipleSelection: true,
      quality: 1,
      selectionLimit: 5,
    });
    if (!result.canceled) {
      const newVideos = result.assets.map(a=>({id:Date.now()+Math.random(), uri:a.uri, duration:a.duration}));
      updateDay(d=>({...d, videos:[...(d.videos||[]),...newVideos]}));
    }
  };

  const deleteVideo = (videoId) => {
    Alert.alert('删除视频','确定删除这段视频？',[
      {text:t('cancel'),style:'cancel'},
      {text:'删除',style:'destructive',onPress:()=>{
        updateDay(d=>({...d,videos:(d.videos||[]).filter(v=>v.id!==videoId)}));
      }},
    ]);
  };

  const showPhotoOptions = () => Alert.alert(t('day_photo_source'),'选择来源',[
    {text:t('day_photo_album'),onPress:pickPhotos},
    {text:t('day_photo_camera'),onPress:takePhoto},
    {text:t('cancel'),style:'cancel'},
  ]);

  const photos = day.photos||[];
  const hasContent = day.memos.length>0||photos.length>0;

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
              <Text style={s.actionBtnText}>📝 感言</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.actionBtn,{borderColor:'#4ECDC450',backgroundColor:'#4ECDC415'}]} onPress={showPhotoOptions}>
              <Text style={[s.actionBtnText,{color:'#4ECDC4'}]}>📸 照片</Text>
            </TouchableOpacity>
          </View>
        </View>

        {!hasContent ? (
          <View style={s.emptyBox}>
            <Text style={s.emptyEmoji}>✏️</Text>
            <Text style={s.emptyText}>今天还没有记录</Text>
            <View style={s.emptyBtns}>
              <TouchableOpacity style={s.emptyBtn} onPress={openNewMemo}><Text style={s.emptyBtnText}>📝 写感言</Text></TouchableOpacity>
              <TouchableOpacity style={[s.emptyBtn,{borderColor:'#4ECDC450',backgroundColor:'#4ECDC415'}]} onPress={showPhotoOptions}><Text style={[s.emptyBtnText,{color:'#4ECDC4'}]}>📸 传照片</Text></TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            {photos.length>0 && (
              <>
                <Text style={s.sectionTitle}>照片 ({photos.length})</Text>
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

            {/* 视频功能 v2.0 上线，代码保留暂时隐藏 */}

            {day.memos.length>0 && (
              <>
                <Text style={s.sectionTitle}>旅行感言 ({day.memos.length})</Text>
                {day.memos.map(memo=>(
                  <TouchableOpacity key={String(memo.id)} style={s.memoCard} onPress={()=>openEditMemo(memo)} activeOpacity={0.8}>
                    <View style={s.memoTop}>
                      <View style={[s.tagBadge,{backgroundColor:`${TAG_COLORS[memo.tag]||'#888'}20`,borderColor:`${TAG_COLORS[memo.tag]||'#888'}50`}]}>
                        <Text style={[s.tagText,{color:TAG_COLORS[memo.tag]||'#888'}]}>{memo.tag}</Text>
                      </View>
                      <View style={{flexDirection:'row',gap:8,alignItems:'center'}}>
                        <Text style={s.memoTime}>{memo.time}</Text>
                        <Text style={s.editHint}>点击编辑</Text>
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
            <Text style={s.photoDeleteText}>🗑 删除照片</Text>
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
                    <Text style={{color:'#FF6B6B',fontSize:14}}>删除</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={()=>setShowMemoModal(false)}><Text style={s.closeBtn}>✕</Text></TouchableOpacity>
              </View>
            </View>
            <Text style={s.inputLabel}>标签</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:16}}>
              <View style={{flexDirection:'row',gap:8}}>
                {TAGS.map(t=>(
                  <TouchableOpacity key={t} onPress={()=>setSelectedTag(t)} style={[s.tagChip,selectedTag===t&&{backgroundColor:`${TAG_COLORS[t]}20`,borderColor:`${TAG_COLORS[t]}60`}]}>
                    <Text style={[s.tagChipText,selectedTag===t&&{color:TAG_COLORS[t]}]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <Text style={s.inputLabel}>内容</Text>
            <TextInput style={[s.input,{height:140,textAlignVertical:'top'}]} placeholder="此刻的感受、看到的风景、尝到的美食..." placeholderTextColor="#444" multiline value={memoText} onChangeText={setMemoText} autoFocus/>
            <View style={{flexDirection:'row',gap:12}}>
              <TouchableOpacity style={s.cancelBtn} onPress={()=>setShowMemoModal(false)}><Text style={s.cancelText}>取消</Text></TouchableOpacity>
              <TouchableOpacity style={s.confirmBtn} onPress={saveMemo}><Text style={s.confirmText}>{editingMemo?t('save'):t('save')}</Text></TouchableOpacity>
            </View>
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
  emptyBox:{alignItems:'center',paddingVertical:48},
  emptyEmoji:{fontSize:48,marginBottom:12},
  emptyText:{fontSize:16,color:'#555',marginBottom:20},
  emptyBtns:{flexDirection:'row',gap:10},
  emptyBtn:{borderWidth:1,borderColor:'#D4AF3750',backgroundColor:'#D4AF3715',borderRadius:20,paddingHorizontal:16,paddingVertical:10},
  emptyBtnText:{color:'#D4AF37',fontSize:14},
  sectionTitle:{fontSize:11,color:'#555',letterSpacing:3,textTransform:'uppercase',marginBottom:12},
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
  videoCard:{backgroundColor:'#161616',borderRadius:12,padding:12,flexDirection:'row',alignItems:'center',gap:12,borderWidth:1,borderColor:'#2A2A2A'},
  videoThumb:{width:56,height:56,borderRadius:10,backgroundColor:'#1A1A1A',alignItems:'center',justifyContent:'center'},
  videoName:{fontSize:14,color:'#F0EDE8'},
  videoDuration:{fontSize:12,color:'#555',marginTop:4},
  cancelBtn:{flex:1,padding:16,borderRadius:14,backgroundColor:'#1A1A1A',alignItems:'center'},
  cancelText:{color:'#555',fontSize:15},
  confirmBtn:{flex:1,padding:16,borderRadius:14,backgroundColor:'#D4AF37',alignItems:'center'},
  confirmText:{color:'#0D0D0D',fontSize:15,fontWeight:'700'},
});
