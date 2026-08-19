// @ts-nocheck

function compact(value) {
  return String(value || '').trim();
}

function flattenTripMemos(trip) {
  if (!trip?.days) return [];
  return trip.days.flatMap(day =>
    (day.memos || []).map(memo => ({
      date: day.date,
      tag: memo.tag,
      text: compact(memo.text),
    })).filter(memo => memo.text)
  );
}

function countTripPhotos(trip) {
  if (!trip?.days) return 0;
  return trip.days.reduce((total, day) => total + (day.photos || []).length, 0);
}

function getTripName(trip) {
  const city = compact(trip?.city);
  const country = compact(trip?.country);
  if (city && country) return `${city}, ${country}`;
  return city || country || '';
}

function buildHighlights(trip, day) {
  const sourceMemos = day
    ? (day.memos || []).map(memo => ({ date: day.date, tag: memo.tag, text: compact(memo.text) })).filter(memo => memo.text)
    : flattenTripMemos(trip);

  return sourceMemos.slice(0, 8).map(memo => {
    const prefix = [memo.date, memo.tag].filter(Boolean).join(' · ');
    return prefix ? `${prefix}: ${memo.text}` : memo.text;
  });
}

/**
 * Labels the caller supplies from the current interface language.
 *
 * English only as a last resort. This file used to be hardcoded English
 * throughout, so a Chinese user got a Chinese heading above an English body —
 * the app's own screens were translated and the thing they were reading was
 * not.
 */
const DEFAULT_STORY_LABELS = {
  place: 'a new destination',
  diaryTitle: (dest) => `${dest} · Travel diary`,
  summaryTitle: (dest) => `${dest} · Trip summary`,
  stats: (days, notes, photos) => `${days} days · ${notes} notes · ${photos} photos`,
  notes: 'Notes',
  empty: 'No notes yet. Write a few and they will appear here.',
  hashtags: '#WanderNote #TravelDiary',
};

/**
 * What the user actually wrote, arranged — not invented prose.
 *
 * The previous version produced paragraphs of generic travel writing that said
 * nothing about the trip ("every small record helps keep it vivid"). Offline,
 * the honest and more useful thing is to surface the notes, dates and counts
 * the user already has.
 */
export function buildLocalTravelStory({
  mode = 'diary',
  trip = null,
  day = null,
  labels = null,
} = {}) {
  const L = { ...DEFAULT_STORY_LABELS, ...(labels || {}) };
  const destination = getTripName(trip) || L.place;
  const daysCount = trip?.days?.length || 0;
  const notes = flattenTripMemos(trip);
  const photoCount = day ? (day.photos || []).length : countTripPhotos(trip);
  const highlights = buildHighlights(trip, day);
  const emoji = trip?.emoji || '🌍';

  if (mode === 'social') {
    return [
      `${emoji} ${destination}`,
      '',
      highlights.length ? highlights.slice(0, 2).join('\n') : L.empty,
      '',
      L.stats(daysCount, notes.length, photoCount),
      '',
      L.hashtags,
    ].join('\n');
  }

  const title = mode === 'summary' ? L.summaryTitle(destination) : L.diaryTitle(destination);

  return [
    `${emoji} ${title}`,
    '',
    L.stats(daysCount, notes.length, photoCount),
    '',
    L.notes,
    ...(highlights.length ? highlights.map(item => `· ${item}`) : [L.empty]),
  ].join('\n');
}

// 英文兜底，调用方没传 labels 时使用。
const DEFAULT_ITINERARY_LABELS = {
  title: (dest, n) => `${dest} ${n}-Day Travel Plan`,
  dayNumber: (n) => `Day ${n}`,
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  distance: 'Distance',
  duration: 'Duration',
  status: 'Opening status',
  tips: 'Tips',
  morningText: 'Start with an easy landmark, neighborhood walk, or local cafe near your stay.',
  afternoonText: 'Visit one main attraction and leave time for transit, meals, and notes.',
  eveningText: 'Keep the schedule flexible for dinner, a viewpoint, or a relaxed walk.',
  distanceText: 'Keep routes compact and group nearby places together.',
  durationText: 'Plan 2-3 focused blocks instead of rushing the whole day.',
  statusText: 'Check hours locally before departure.',
  tipsText: 'Save addresses, tickets, weather notes, and packing reminders in WanderNote.',
};

export function buildLocalItinerary({ destination, days = 5, style = 'balanced', labels = null } = {}) {
  const dest = compact(destination) || 'your next destination';
  const dayCount = Math.max(1, Math.min(14, Number.parseInt(days, 10) || 5));
  const styleText = compact(style) || 'balanced';

  // 标签由调用方按当前界面语言传入。否则中文界面下会出现
  // 「Day 1 · Osaka 综合 route」这种中英混排。
  const L = { ...DEFAULT_ITINERARY_LABELS, ...(labels || {}) };

  const plans = Array.from({ length: dayCount }, (_, index) => {
    const day = index + 1;
    return [
      `📅 ${L.dayNumber(day)} · ${dest} · ${styleText}`,
      `🌅 ${L.morning}: ${L.morningText}`,
      `☀️ ${L.afternoon}: ${L.afternoonText}`,
      `🌙 ${L.evening}: ${L.eveningText}`,
      `📍 ${L.distance}: ${L.distanceText}`,
      `⏱ ${L.duration}: ${L.durationText}`,
      `🏪 ${L.status}: ${L.statusText}`,
      `💡 ${L.tips}: ${L.tipsText}`,
    ].join('\n');
  }).join('\n\n');

  // 不再自带免责声明：调用方已经在结果顶部显示了本地化的 ai_offline_notice，
  // 两句话说同一件事只会显得像出了两次错。
  return [`🗺 ${L.title(dest, dayCount)}`, '', plans].join('\n');
}

export function buildLocalPackingGroups(destination, days) {
  const dest = compact(destination) || 'Trip';
  const dayCount = compact(days) || '5';
  return {
    title: `${dest} ${dayCount}-day packing list`,
    groups: {
      Documents: ['🪪 Passport / ID', '🎫 Tickets or booking confirmations', '🏨 Hotel address', '🧾 Travel insurance', '📋 Emergency contacts'],
      Money: ['💳 Credit card', '💵 Local cash', '🪙 Small change', '📱 Mobile payment setup', '🧾 Expense notes'],
      Electronics: ['🔌 Charger', '🔋 Power bank', '🌐 Travel adapter', '🎧 Headphones', '📱 Phone cable'],
      Clothing: ['👕 Daily outfits', '🧥 Light jacket', '🧦 Socks', '🩴 Comfortable shoes', '🧢 Hat or sun protection'],
      Toiletries: ['🪥 Toothbrush', '🧴 Skincare', '🧼 Shampoo or cleanser', '💊 Personal medicine', '🧻 Tissues'],
      'Special items': ['☂️ Weather-ready item', '🎒 Day bag', '📷 Camera', '🗺 Offline map', '📝 Travel notes'],
    },
  };
}

export function extractReadableAiText(text) {
  const clean = compact(text).replace(/```json|```/g, '').trim();
  if (!clean) return '';
  if (clean.startsWith('{') || clean.startsWith('[')) return '';
  return clean;
}
