export function filterTripDays(days, { query = '', content = 'all', order = 'newest' } = {}) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filtered = (days || []).filter(day => {
    const memos = Array.isArray(day.memos) ? day.memos : [];
    const photos = Array.isArray(day.photos) ? day.photos : [];
    const hasNotes = memos.length > 0;
    const hasPhotos = photos.length > 0;
    if (content === 'notes' && !hasNotes) return false;
    if (content === 'photos' && !hasPhotos) return false;
    if (!normalizedQuery) return true;
    return [day.date, day.weekDay, ...memos.map(memo => memo.text || '')]
      .some(value => String(value).toLocaleLowerCase().includes(normalizedQuery));
  });

  return filtered.sort((a, b) => order === 'oldest'
    ? a.date.localeCompare(b.date)
    : b.date.localeCompare(a.date));
}
