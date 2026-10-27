import { normalizeDayMemoTag } from './dayMemoFilters';

export function buildDayShareText({ trip, day, dayNumber, labels }) {
  const destination = [trip.emoji, trip.city, trip.country].filter(Boolean).join(' ');
  const lines = [
    `📍 ${destination}`,
    `📅 ${labels.dayHeading(dayNumber, day.date)}`,
    ...(day.memos || []).map(memo => {
      const tag = normalizeDayMemoTag(memo.tag);
      return `${labels.tags[tag] || labels.note}: ${memo.text}`;
    }),
  ];
  const photoCount = (day.photos || []).length;
  if (photoCount > 0) lines.push(`📸 ${labels.photoCount(photoCount)}`);
  lines.push(`— ${labels.source}`);
  return lines.join('\n');
}
