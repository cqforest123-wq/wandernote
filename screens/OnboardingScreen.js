import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Dimensions, ScrollView, SafeAreaView, StatusBar
} from 'react-native';
import { useTranslation } from 'react-i18next';

const { width, height } = Dimensions.get('window');

const PAGES = [
  {
    emoji: '🌍',
    bgColor: '#0D2B28',
    accentColor: '#4ECDC4',
    titleKey: 'onboarding_1_title',
    subKey: 'onboarding_1_sub',
    descKey: 'onboarding_1_desc',
    featureKeys: null,
  },
  {
    emoji: '📖',
    bgColor: '#1A1A0D',
    accentColor: '#D4AF37',
    titleKey: 'onboarding_2_title',
    subKey: 'onboarding_2_sub',
    descKey: 'onboarding_2_desc',
    featureKeys: ['onboarding_2_feature_1', 'onboarding_2_feature_2', 'onboarding_2_feature_3'],
  },
  {
    emoji: '✦',
    bgColor: '#1A0D2B',
    accentColor: '#A78BFA',
    titleKey: 'onboarding_3_title',
    subKey: 'onboarding_3_sub',
    descKey: 'onboarding_3_desc',
    featureKeys: ['onboarding_3_feature_1', 'onboarding_3_feature_2', 'onboarding_3_feature_3'],
  },
  {
    emoji: '🗺',
    bgColor: '#0D1A2B',
    accentColor: '#60A5FA',
    titleKey: 'onboarding_4_title',
    subKey: 'onboarding_4_sub',
    descKey: 'onboarding_4_desc',
    featureKeys: ['onboarding_4_feature_1', 'onboarding_4_feature_2', 'onboarding_4_feature_3'],
  },
];

export default function OnboardingScreen({ onDone }) {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(0);
  const scrollRef = useRef(null);

  const goToPage = (index) => {
    scrollRef.current?.scrollTo({ x: index * width, animated: true });
    setCurrentPage(index);
  };

  const handleNext = () => {
    if (currentPage < PAGES.length - 1) {
      goToPage(currentPage + 1);
    } else {
      onDone();
    }
  };

  const page = PAGES[currentPage];

  return (
    <SafeAreaView style={[s.container, { backgroundColor: page.bgColor }]}>
      <StatusBar barStyle="light-content" backgroundColor={page.bgColor} />

      {/* 跳过按钮 */}
      {currentPage < PAGES.length - 1 && (
        <TouchableOpacity style={s.skipBtn} onPress={onDone}>
          <Text style={s.skipText}>{t('onboarding_skip')}</Text>
        </TouchableOpacity>
      )}

      {/* 滑动内容 */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        style={{ flex: 1 }}
      >
        {PAGES.map((p, idx) => (
          <View key={idx} style={[s.page, { width }]}>
            {/* 大emoji */}
            <View style={[s.emojiCircle, { borderColor: p.accentColor + '40', backgroundColor: p.accentColor + '15' }]}>
              <Text style={s.emojiText}>{p.emoji}</Text>
            </View>

            {/* 标题区 */}
            <Text style={[s.title, { color: p.accentColor }]}>{t(p.titleKey)}</Text>
            <Text style={s.subtitle}>{t(p.subKey)}</Text>
            <Text style={s.desc}>{t(p.descKey)}</Text>

            {/* 功能列表 */}
            {p.featureKeys && (
              <View style={s.featureList}>
                {p.featureKeys.map((key, i) => (
                  <View key={i} style={[s.featureItem, { borderColor: p.accentColor + '30', backgroundColor: p.accentColor + '10' }]}>
                    <Text style={[s.featureText, { color: p.accentColor }]}>{t(key)}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* 底部区域 */}
      <View style={s.bottom}>
        {/* 进度点 */}
        <View style={s.dots}>
          {PAGES.map((_, idx) => (
            <TouchableOpacity key={idx} onPress={() => goToPage(idx)}>
              <View style={[
                s.dot,
                idx === currentPage
                  ? [s.dotActive, { backgroundColor: page.accentColor }]
                  : s.dotInactive
              ]} />
            </TouchableOpacity>
          ))}
        </View>

        {/* 下一步/开始按钮 */}
        <TouchableOpacity
          style={[s.nextBtn, { backgroundColor: page.accentColor }]}
          onPress={handleNext}
        >
          <Text style={s.nextBtnText}>
            {currentPage === PAGES.length - 1 ? t('onboarding_start') : t('onboarding_next')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  skipBtn: { position: 'absolute', top: 56, right: 24, zIndex: 10, padding: 8 },
  skipText: { color: '#555', fontSize: 14 },
  page: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36, paddingTop: 40 },
  emojiCircle: {
    width: 140, height: 140, borderRadius: 70,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
    marginBottom: 40,
  },
  emojiText: { fontSize: 64 },
  title: { fontSize: 32, fontWeight: '300', letterSpacing: -1, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#888', marginBottom: 16, textAlign: 'center' },
  desc: { fontSize: 14, color: '#555', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  featureList: { gap: 10, width: '100%' },
  featureItem: { borderWidth: 1, borderRadius: 12, padding: 14 },
  featureText: { fontSize: 14 },
  bottom: { paddingHorizontal: 24, paddingBottom: 24, gap: 20 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotActive: { width: 20 },
  dotInactive: { backgroundColor: '#2A2A2A' },
  nextBtn: { borderRadius: 16, padding: 18, alignItems: 'center' },
  nextBtnText: { color: '#0D0D0D', fontSize: 16, fontWeight: '700' },
});
