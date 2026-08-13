import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

// 卡片按点渲染，截图时再按 3x 输出，保证在手机上看清晰。
export const CARD_WIDTH = 340;

// 分享卡要的是一段动人的摘录，不是整篇日记。300 字会让卡片高宽比接近 1:2.3，
// 发 Instagram 会被裁掉大半。170 字大致落在 3:4 到 4:5 之间。
const MAX_BODY_CHARS = 170;

// AI 常在开头自己写一行日期地点，而卡片头部已经有了，去掉避免重复。
function stripLeadingDateLine(text) {
  const lines = String(text || '').split('\n');
  const first = (lines[0] || '').trim();
  const looksLikeDate = /\d{4}\s*[年./-]/.test(first) && first.length <= 40;
  return looksLikeDate ? lines.slice(1).join('\n').trim() : text;
}

function trimBody(text) {
  const clean = stripLeadingDateLine(String(text || '').trim()).trim();
  if (clean.length <= MAX_BODY_CHARS) return clean;
  // 尽量断在句末，避免把句子拦腰截断
  const slice = clean.slice(0, MAX_BODY_CHARS);
  const lastStop = Math.max(
    slice.lastIndexOf('。'), slice.lastIndexOf('.'),
    slice.lastIndexOf('！'), slice.lastIndexOf('!'),
    slice.lastIndexOf('？'), slice.lastIndexOf('?'),
    slice.lastIndexOf('\n')
  );
  return (lastStop > MAX_BODY_CHARS * 0.6 ? slice.slice(0, lastStop + 1) : slice.trimEnd() + '…');
}

/**
 * 用于截图分享的卡片。渲染在屏幕外，只作为 view-shot 的输入。
 */
export default function ShareCard({ cardRef, emoji, title, subtitle, body, photoUri }) {
  // 图片读不出来时整块隐藏，而不是留一个灰方块 —— 空占位比没有更难看。
  const [photoOk, setPhotoOk] = React.useState(true);

  return (
    <View ref={cardRef} collapsable={false} style={s.card}>
      <View style={s.header}>
        <Text style={s.emoji}>{emoji || '🌍'}</Text>
        <View style={{ flex: 1 }}>
          <Text style={s.title} numberOfLines={2}>{title}</Text>
          {subtitle ? <Text style={s.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
        </View>
      </View>

      {photoUri && photoOk ? (
        <Image
          source={{ uri: photoUri }}
          style={s.photo}
          resizeMode="cover"
          onError={() => setPhotoOk(false)}
        />
      ) : null}

      <Text style={s.body}>{trimBody(body)}</Text>

      <View style={s.footer}>
        <View style={s.rule} />
        <Text style={s.brand}>WanderNote</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#0D0D0D',
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  emoji: { fontSize: 34 },
  title: { fontSize: 21, color: '#F0EDE8', fontWeight: '600', letterSpacing: 0.3 },
  subtitle: { fontSize: 12, color: '#7A7A7A', marginTop: 4, letterSpacing: 1 },
  photo: { width: '100%', height: 170, borderRadius: 12, marginBottom: 18, backgroundColor: '#161616' },
  body: { fontSize: 14, color: '#C8C4BC', lineHeight: 25 },
  footer: { marginTop: 22, alignItems: 'center' },
  rule: { width: 36, height: 1, backgroundColor: '#D4AF3760', marginBottom: 10 },
  brand: { fontSize: 11, color: '#D4AF37', letterSpacing: 3 },
});
