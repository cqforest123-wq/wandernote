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

export function normalizeDayMemoTag(tag) {
  return LEGACY_TAG_MAP[tag] || tag || 'feeling';
}

export function filterDayMemos(memos, selectedTag) {
  if (selectedTag === 'all') return [...(memos || [])];
  if (selectedTag === 'favorites') return (memos || []).filter(memo => memo.isFavorite === true);
  return (memos || []).filter(memo => normalizeDayMemoTag(memo.tag) === selectedTag);
}

export function sortDayMemos(memos, order = 'newest') {
  return [...(memos || [])].sort((a, b) => {
    const comparison = String(a.time || '').localeCompare(String(b.time || ''));
    return order === 'oldest' ? comparison : -comparison;
  });
}
