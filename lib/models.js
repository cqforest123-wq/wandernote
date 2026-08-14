// WanderNote 数据模型工厂函数
// 1.0 阶段只用于新增数据，避免继续在各 screen 里手写对象结构。
// 不迁移旧数据，不改变 AsyncStorage / Supabase 结构。

function formatMonth(date = new Date()) {
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function formatDate(date = new Date()) {
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

function formatTime(date = new Date()) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function createTrip({
  city,
  country = '',
  emoji = '🌍',
  plannedDate = null,
  coords = null,
  geocodeStatus = coords ? 'resolved' : 'pending',
}) {
  return {
    id: Date.now(),
    city,
    country,
    date: formatMonth(),
    emoji,
    coords,
    geocodeStatus,
    plannedDate,
    days: [],
  };
}

export function createDay({
  date,
  weekDay,
  memoText = '',
}) {
  const text = String(memoText || '').trim();

  return {
    date,
    weekDay,
    memos: text
      ? [{
          id: Date.now(),
          text,
          // Canonical tag key, not the legacy Chinese label — otherwise every
          // new memo is written in a format that only survives because
          // DayDetailScreen still carries LEGACY_TAG_MAP for old data.
          tag: 'feeling',
          time: formatTime(),
        }]
      : [],
    photos: [],
    expenses: [],
  };
}

export const EXPENSE_CATEGORIES = [
  'food',
  'transport',
  'stay',
  'ticket',
  'shopping',
  'other',
];

export function createExpense({
  amount,
  currency,
  category = 'other',
  note = '',
}) {
  return {
    id: Date.now() + Math.random(),
    amount: Number(amount),
    currency,
    category: EXPENSE_CATEGORIES.includes(category) ? category : 'other',
    note: String(note || '').trim(),
    time: formatTime(),
    createdAt: Date.now(),
  };
}

export function createMemo({
  title,
  items,
  category = 'note',
  tripId = null,
  // Callers pass a translated fallback; this module has no access to i18n and
  // must not bake a Chinese string into a French user's saved data.
  untitledLabel = '',
}) {
  const timeStr = formatDate();

  return {
    id: Date.now(),
    title: String(title || '').trim() || String(untitledLabel || '').trim(),
    items,
    category,
    tripId,
    createdAt: timeStr,
    updatedAt: timeStr,
  };
}

export function createPhoto({ uri, coords = null, takenAt = null }) {
  return {
    id: Date.now() + Math.random(),
    uri,
    // Where the shot was taken, when EXIF carries it. Kept on the photo so the
    // map can draw a real footprint instead of only city-level pins.
    coords: coords && Number.isFinite(Number(coords.lat)) && Number.isFinite(Number(coords.lng))
      ? { lat: Number(coords.lat), lng: Number(coords.lng) }
      : null,
    takenAt: takenAt ? new Date(takenAt).toISOString() : null,
  };
}

export function getTodayText() {
  return formatDate();
}
