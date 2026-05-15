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
}) {
  return {
    id: Date.now(),
    city,
    country,
    date: formatMonth(),
    emoji,
    coords,
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
          tag: '感受',
          time: formatTime(),
        }]
      : [],
    photos: [],
    videos: [],
  };
}

export function createMemo({
  title,
  items,
  category = 'note',
  tripId = null,
}) {
  const timeStr = formatDate();

  return {
    id: Date.now(),
    title: String(title || '').trim() || '未命名清单',
    items,
    category,
    tripId,
    createdAt: timeStr,
    updatedAt: timeStr,
  };
}

export function createPhoto({ uri }) {
  return {
    id: Date.now() + Math.random(),
    uri,
  };
}

export function createVideo({ uri, duration = null }) {
  return {
    id: Date.now() + Math.random(),
    uri,
    duration,
  };
}

export function getTodayText() {
  return formatDate();
}
