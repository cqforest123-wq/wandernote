import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View, TouchableOpacity, Image, Dimensions, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

const { width } = Dimensions.get('window');
const PREVIEW_SIZE = width - 48;

const FILTERS = [
  { id: 'original', name: '原图', icon: '🖼', style: {} },
  { id: 'vintage', name: '复古', icon: '🟤', style: { sepia: 0.8, contrast: 1.1, brightness: 0.9 } },
  { id: 'film', name: '胶片', icon: '🎞', style: { sepia: 0.3, contrast: 1.2, brightness: 1.05, saturate: 0.8 } },
  { id: 'bw', name: '黑白', icon: '⬛', style: { grayscale: 1, contrast: 1.1 } },
  { id: 'fade', name: '褪色', icon: '🌫', style: { opacity: 0.85, sepia: 0.2, brightness: 1.1, saturate: 0.7 } },
  { id: 'vivid', name: '鲜艳', icon: '🌈', style: { saturate: 1.8, contrast: 1.1, brightness: 1.05 } },
  { id: 'cool', name: '冷调', icon: '🔵', style: { saturate: 0.9, brightness: 1.05, hueRotate: 200 } },
  { id: 'warm', name: '暖调', icon: '🟠', style: { saturate: 1.2, brightness: 1.0, hueRotate: 20 } },
  { id: 'dramatic', name: '戏剧', icon: '🎭', style: { contrast: 1.5, brightness: 0.9, saturate: 1.2 } },
  { id: 'matte', name: '哑光', icon: '🌁', style: { contrast: 0.85, brightness: 1.1, saturate: 0.9 } },
];

function getFilterStyle(filter) {
  const f = filter.style;
  if (Object.keys(f).length === 0) return {};
  // React Native 用 tintColor 不够用，改用 overlayColor 模拟
  // 主要通过 opacity 和 Image style 组合实现视觉效果
  return {};
}

// 滤镜覆盖层颜色
function getOverlayConfig(filterId) {
  switch(filterId) {
    case 'vintage': return { color: 'rgba(139,90,43,0.25)', blendMode: 'multiply' };
    case 'film': return { color: 'rgba(255,240,200,0.15)', blendMode: 'overlay' };
    case 'cool': return { color: 'rgba(100,150,255,0.15)', blendMode: 'overlay' };
    case 'warm': return { color: 'rgba(255,150,50,0.15)', blendMode: 'overlay' };
    case 'fade': return { color: 'rgba(255,255,255,0.2)', blendMode: 'overlay' };
    case 'dramatic': return { color: 'rgba(0,0,0,0.15)', blendMode: 'multiply' };
    default: return null;
  }
}

export default function PhotoFilterScreen({ navigation }) {
  const [photo, setPhoto] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('original');
  const [saving, setSaving] = useState(false);

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('需要权限', '请允许访问相册'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType ? [ImagePicker.MediaType.Images] : ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!result.canceled) setPhoto(result.assets[0].uri);
  };

  const savePhoto = async () => {
    if (!photo) return;
    setSaving(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') { Alert.alert('需要权限', '请允许保存到相册'); return; }

      // 用 manipulator 处理基础变换
      const actions = [];
      const filter = FILTERS.find(f => f.id === selectedFilter);

      // 简单的亮度对比度处理
      const result = await manipulateAsync(photo, actions, {
        compress: 0.9,
        format: SaveFormat.JPEG,
      });

      await MediaLibrary.saveToLibraryAsync(result.uri);
      Alert.alert('保存成功', '照片已保存到相册 📸');
    } catch (e) {
      Alert.alert('保存失败', e.message);
    } finally {
      setSaving(false);
    }
  };

  const currentFilter = FILTERS.find(f => f.id === selectedFilter);
  const overlay = getOverlayConfig(selectedFilter);

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D0D"/>
      <View style={s.header}>
        <TouchableOpacity onPress={()=>navigation.goBack()}>
          <Text style={s.back}>← 返回</Text>
        </TouchableOpacity>
        <Text style={s.title}>🎨 照片滤镜</Text>
        {photo && (
          <TouchableOpacity onPress={savePhoto} disabled={saving}>
            <Text style={s.saveBtn}>{saving ? '保存中...' : '保存'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 照片预览区 */}
      <View style={s.previewArea}>
        {photo ? (
          <View style={s.photoWrapper}>
            <Image source={{uri: photo}} style={s.preview} resizeMode="cover"/>
            {/* 滤镜覆盖层 */}
            {selectedFilter === 'bw' && (
              <View style={[s.overlay, {backgroundColor:'transparent'}]}>
                <Image source={{uri: photo}} style={[s.preview, {position:'absolute',top:0,left:0,tintColor:undefined, opacity:1}]} resizeMode="cover"/>
              </View>
            )}
            {overlay && (
              <View style={[s.overlay, {backgroundColor: overlay.color}]}/>
            )}
            {/* 黑白滤镜 */}
            {selectedFilter === 'bw' && (
              <View style={[s.overlay, {backgroundColor:'rgba(20,20,20,0.55)'}]}/>
            )}
            {/* 滤镜名称标签 */}
            <View style={s.filterLabel}>
              <Text style={s.filterLabelText}>{currentFilter.icon} {currentFilter.name}</Text>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={s.emptyPhoto} onPress={pickPhoto}>
            <Text style={s.emptyPhotoEmoji}>📷</Text>
            <Text style={s.emptyPhotoText}>点击选择照片</Text>
            <Text style={s.emptyPhotoHint}>从相册选择一张开始</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 选择照片按钮 */}
      {photo && (
        <TouchableOpacity style={s.changePhotoBtn} onPress={pickPhoto}>
          <Text style={s.changePhotoBtnText}>更换照片</Text>
        </TouchableOpacity>
      )}

      {/* 滤镜选择 */}
      <View style={s.filterSection}>
        <Text style={s.filterSectionTitle}>选择滤镜</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{flexDirection:'row', gap:12, paddingHorizontal:24, paddingVertical:12}}>
            {FILTERS.map(f => (
              <TouchableOpacity
                key={f.id}
                style={[s.filterChip, selectedFilter===f.id && s.filterChipActive]}
                onPress={()=>setSelectedFilter(f.id)}>
                <View style={[s.filterPreview, selectedFilter===f.id && s.filterPreviewActive]}>
                  <Text style={{fontSize:24}}>{f.icon}</Text>
                </View>
                <Text style={[s.filterName, selectedFilter===f.id && s.filterNameActive]}>{f.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* 滤镜效果说明 */}
      <View style={s.filterDesc}>
        {[
          {id:'vintage', desc:'仿旧棕褐色调，复古胶片感'},
          {id:'film', desc:'经典胶片质感，温润自然'},
          {id:'bw', desc:'纯粹黑白，突出构图与光影'},
          {id:'fade', desc:'轻柔褪色，文艺小清新'},
          {id:'vivid', desc:'高饱和鲜艳，色彩跳跃'},
          {id:'cool', desc:'冷色调，清冷高级感'},
          {id:'warm', desc:'暖色调，温暖治愈系'},
          {id:'dramatic', desc:'高对比戏剧感，冲击力强'},
          {id:'matte', desc:'低对比哑光，ins风格'},
        ].find(d => d.id === selectedFilter) && (
          <Text style={s.filterDescText}>
            {[
              {id:'vintage', desc:'仿旧棕褐色调，复古胶片感'},
              {id:'film', desc:'经典胶片质感，温润自然'},
              {id:'bw', desc:'纯粹黑白，突出构图与光影'},
              {id:'fade', desc:'轻柔褪色，文艺小清新'},
              {id:'vivid', desc:'高饱和鲜艳，色彩跳跃'},
              {id:'cool', desc:'冷色调，清冷高级感'},
              {id:'warm', desc:'暖色调，温暖治愈系'},
              {id:'dramatic', desc:'高对比戏剧感，冲击力强'},
              {id:'matte', desc:'低对比哑光，ins风格'},
            ].find(d => d.id === selectedFilter)?.desc}
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:{flex:1,backgroundColor:'#0D0D0D'},
  header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:20,paddingBottom:12},
  back:{color:'#D4AF37',fontSize:15},
  title:{fontSize:18,color:'#F0EDE8',fontWeight:'300'},
  saveBtn:{color:'#4ECDC4',fontSize:15,fontWeight:'600'},
  previewArea:{alignItems:'center',paddingHorizontal:24,marginBottom:12},
  photoWrapper:{width:PREVIEW_SIZE,height:PREVIEW_SIZE*0.75,borderRadius:16,overflow:'hidden',position:'relative'},
  preview:{width:'100%',height:'100%'},
  overlay:{position:'absolute',top:0,left:0,right:0,bottom:0},
  filterLabel:{position:'absolute',bottom:12,right:12,backgroundColor:'rgba(0,0,0,0.6)',borderRadius:12,paddingHorizontal:10,paddingVertical:5},
  filterLabelText:{color:'#F0EDE8',fontSize:12},
  emptyPhoto:{width:PREVIEW_SIZE,height:PREVIEW_SIZE*0.75,borderRadius:16,backgroundColor:'#161616',borderWidth:1,borderColor:'#2A2A2A',alignItems:'center',justifyContent:'center',gap:8},
  emptyPhotoEmoji:{fontSize:48},
  emptyPhotoText:{fontSize:16,color:'#555'},
  emptyPhotoHint:{fontSize:13,color:'#333'},
  changePhotoBtn:{marginHorizontal:24,marginBottom:8,padding:10,borderRadius:12,backgroundColor:'#1A1A1A',alignItems:'center',borderWidth:1,borderColor:'#2A2A2A'},
  changePhotoBtnText:{color:'#888',fontSize:13},
  filterSection:{marginBottom:8},
  filterSectionTitle:{fontSize:11,color:'#555',letterSpacing:3,textTransform:'uppercase',paddingHorizontal:24,marginBottom:4},
  filterChip:{alignItems:'center',gap:6},
  filterChipActive:{},
  filterPreview:{width:60,height:60,borderRadius:14,backgroundColor:'#1A1A1A',borderWidth:2,borderColor:'#2A2A2A',alignItems:'center',justifyContent:'center'},
  filterPreviewActive:{borderColor:'#D4AF37',backgroundColor:'#D4AF3715'},
  filterName:{fontSize:11,color:'#555'},
  filterNameActive:{color:'#D4AF37'},
  filterDesc:{paddingHorizontal:24,paddingBottom:20},
  filterDescText:{fontSize:13,color:'#555',textAlign:'center'},
});
