import { normalizeDayMemoTag } from './dayMemoFilters';

export function buildTripShareText({ trip, labels }) {
  const days = [...(trip.days || [])].sort((a, b) => a.date.localeCompare(b.date));
  const lines = [
    [trip.emoji, trip.city, trip.country].filter(Boolean).join(' '),
    labels.tripDate(trip.date),
  ];

  days.forEach((day, index) => {
    lines.push('', labels.dayHeading(index + 1, day.date));
    (day.memos || []).forEach(memo => {
      const tag = normalizeDayMemoTag(memo.tag);
      lines.push(`${labels.tags[tag] || labels.note}: ${memo.text}`);
    });
    const photoCount = (day.photos || []).length;
    if (photoCount) lines.push(labels.photoCount(photoCount));
  });

  lines.push('', `— ${labels.source}`);
  return lines.join('\n');
}
