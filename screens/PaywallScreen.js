import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ActivityIndicator, Alert, ScrollView
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { getOfferings, purchasePackage, restorePurchases } from '../lib/purchases';

export default function PaywallScreen({ onSuccess, onClose, featureName }) {
  const { t } = useTranslation();
  const [offerings, setOfferings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState(null);

  useEffect(() => {
    getOfferings()
      .then(o => {
        setOfferings(o);
        if (o?.annual) setSelectedPkg(o.annual);
        else if (o?.monthly) setSelectedPkg(o.monthly);
      })
      .catch(e => {
        console.warn('getOfferings error:', e.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handlePurchase = async () => {
    if (!selectedPkg) return;
    setPurchasing(true);
    const result = await purchasePackage(selectedPkg);
    setPurchasing(false);
    if (result.success && result.isPro) {
      Alert.alert('🎉 订阅成功', '欢迎加入 WanderNote Pro！', [
        { text: '开始使用', onPress: onSuccess }
      ]);
    } else if (!result.cancelled) {
      Alert.alert('购买失败', result.error || '请稍后重试');
    }
  };

  const handleRestore = async () => {
    setPurchasing(true);
    const result = await restorePurchases();
    setPurchasing(false);
    if (result.success && result.isPro) {
      Alert.alert('✅ 恢复成功', '已恢复你的 Pro 订阅', [
        { text: '好的', onPress: onSuccess }
      ]);
    } else {
      Alert.alert('未找到购买记录', '请确认使用了正确的 Apple ID');
    }
  };

  const PRO_FEATURES = [
    { icon: '✈️', text: '无限旅程记录' },
    { icon: '☁️', text: '云端同步备份' },
    { icon: '✦', text: 'AI创作无限次' },
    { icon: '🗺', text: '足迹地图完整版' },
    { icon: '🧳', text: '打包清单无限模板' },
    { icon: '📊', text: '年度旅行报告' },
  ];

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" />

      {/* 关闭按钮 */}
      <TouchableOpacity style={s.closeBtn} onPress={onClose}>
        <Text style={s.closeBtnText}>✕</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* 头部 */}
        <View style={s.header}>
          <Text style={s.crown}>✦</Text>
          <Text style={s.title}>WanderNote Pro</Text>
          {featureName && (
            <Text style={s.featureHint}>解锁「{featureName}」及所有专业功能</Text>
          )}
        </View>

        {/* 功能列表 */}
        <View style={s.features}>
          {PRO_FEATURES.map((f, i) => (
            <View key={i} style={s.featureRow}>
              <Text style={s.featureIcon}>{f.icon}</Text>
              <Text style={s.featureText}>{f.text}</Text>
              <Text style={s.featureCheck}>✓</Text>
            </View>
          ))}
        </View>

        {/* 价格选择 */}
        {loading ? (
          <ActivityIndicator color="#D4AF37" size="large" style={{ marginVertical: 32 }} />
        ) : offerings ? (
          <View style={s.plans}>
            {offerings.annual && (
              <TouchableOpacity
                style={[s.planCard, selectedPkg === offerings.annual && s.planCardActive]}
                onPress={() => setSelectedPkg(offerings.annual)}>
                <View style={s.planBadge}><Text style={s.planBadgeText}>最划算</Text></View>
                <Text style={[s.planName, selectedPkg === offerings.annual && s.planNameActive]}>年度订阅</Text>
                <Text style={[s.planPrice, selectedPkg === offerings.annual && s.planPriceActive]}>
                  {offerings.annual.product.priceString}
                </Text>
                <Text style={s.planNote}>
                  约 {offerings.annual.product.currencyCode} {(offerings.annual.product.price / 12).toFixed(2)}/月
                </Text>
              </TouchableOpacity>
            )}
            {offerings.monthly && (
              <TouchableOpacity
                style={[s.planCard, selectedPkg === offerings.monthly && s.planCardActive]}
                onPress={() => setSelectedPkg(offerings.monthly)}>
                <Text style={[s.planName, selectedPkg === offerings.monthly && s.planNameActive]}>月度订阅</Text>
                <Text style={[s.planPrice, selectedPkg === offerings.monthly && s.planPriceActive]}>
                  {offerings.monthly.product.priceString}
                </Text>
                <Text style={s.planNote}>按月付费，随时取消</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={s.noOfferings}>
            <Text style={s.noOfferingsText}>暂时无法加载价格，请稍后重试</Text>
          </View>
        )}

        {/* 购买按钮 */}
        <TouchableOpacity
          style={[s.buyBtn, (!selectedPkg || purchasing) && s.buyBtnDisabled]}
          onPress={handlePurchase}
          disabled={!selectedPkg || purchasing}>
          {purchasing
            ? <ActivityIndicator color="#0D0D0D" />
            : <Text style={s.buyBtnText}>开始订阅 →</Text>
          }
        </TouchableOpacity>

        {/* 恢复购买 */}
        <TouchableOpacity style={s.restoreBtn} onPress={handleRestore} disabled={purchasing}>
          <Text style={s.restoreBtnText}>恢复购买</Text>
        </TouchableOpacity>

        <Text style={s.legal}>
          订阅将自动续费，可随时在 App Store 订阅设置中取消。{'\n'}
          续订将在到期前24小时内扣款。
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  scroll: { padding: 24, paddingBottom: 48 },
  closeBtn: { position: 'absolute', top: 56, right: 24, zIndex: 10, padding: 8 },
  closeBtnText: { color: '#555', fontSize: 18 },
  header: { alignItems: 'center', marginTop: 40, marginBottom: 32 },
  crown: { fontSize: 48, color: '#D4AF37', marginBottom: 12 },
  title: { fontSize: 28, color: '#F0EDE8', fontWeight: '300', letterSpacing: -1 },
  featureHint: { fontSize: 14, color: '#888', marginTop: 8, textAlign: 'center' },
  features: { backgroundColor: '#161616', borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: '#242424' },
  featureRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  featureIcon: { fontSize: 20, width: 28 },
  featureText: { flex: 1, fontSize: 15, color: '#F0EDE8' },
  featureCheck: { color: '#D4AF37', fontSize: 14, fontWeight: '700' },
  plans: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  planCard: { flex: 1, backgroundColor: '#161616', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#242424', position: 'relative', overflow: 'hidden' },
  planCardActive: { borderColor: '#D4AF37', backgroundColor: '#D4AF3715' },
  planBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#D4AF37', paddingHorizontal: 8, paddingVertical: 3, borderBottomLeftRadius: 8 },
  planBadgeText: { fontSize: 10, color: '#0D0D0D', fontWeight: '700' },
  planName: { fontSize: 14, color: '#888', marginBottom: 8, marginTop: 16 },
  planNameActive: { color: '#D4AF37' },
  planPrice: { fontSize: 24, color: '#F0EDE8', fontWeight: '300' },
  planPriceActive: { color: '#D4AF37' },
  planNote: { fontSize: 11, color: '#555', marginTop: 6, textAlign: 'center' },
  noOfferings: { padding: 24, alignItems: 'center' },
  noOfferingsText: { color: '#555', fontSize: 14 },
  buyBtn: { backgroundColor: '#D4AF37', borderRadius: 16, padding: 18, alignItems: 'center', marginBottom: 12 },
  buyBtnDisabled: { opacity: 0.5 },
  buyBtnText: { color: '#0D0D0D', fontSize: 16, fontWeight: '700' },
  restoreBtn: { padding: 12, alignItems: 'center', marginBottom: 16 },
  restoreBtnText: { color: '#555', fontSize: 14 },
  legal: { fontSize: 11, color: '#333', textAlign: 'center', lineHeight: 18 },
});
