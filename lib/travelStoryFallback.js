import english from '../i18n/en';
import { normalizeDayMemoTag } from './dayMemoFilters';

function compact(value) {
  return String(value || '').trim();
}

function makeText(translate) {
  return (key, values = {}) => translate
    ? translate(key, values)
    : english[key].replace(/{{(\w+)}}/g, (_, name) => String(values[name] ?? ''));
}

function tripNotes(trip) {
  return (trip?.days || []).flatMap(day => (day.memos || [])
    .filter(memo => compact(memo.text)).map(memo => ({ ...memo, date: day.date })));
}

export function buildLocalTravelStory({ mode = 'diary', trip = null, day = null, translate } = {}) {
  const text = makeText(translate);
  const destination = [trip?.city, trip?.country].map(compact).filter(Boolean).join(', ') || text('draft_destination_default');
  const notes = tripNotes(trip);
  const selectedNotes = day ? (day.memos || []).map(memo => ({ ...memo, date: day.date })) : notes;
  const photoCount = (day ? [day] : trip?.days || []).reduce((total, item) => total + (item.photos || []).length, 0);
  const highlights = selectedNotes.filter(memo => compact(memo.text)).slice(0, 6).map(memo => {
    const tagKey = `day_tag_${normalizeDayMemoTag(memo.tag)}`;
    const tag = memo.tag ? (english[tagKey] ? text(tagKey) : compact(memo.tag)) : '';
    const prefix = [memo.date, tag].filter(Boolean).join(' · ');
    return prefix ? `${prefix}: ${compact(memo.text)}` : compact(memo.text);
  });
  if (!highlights.length) highlights.push(text('draft_highlight_empty'));
  const date = compact(trip?.plannedDate || trip?.date);
  const intro = trip
    ? text(date ? 'draft_intro_dated' : 'draft_intro', { destination, date })
    : text('draft_intro_empty');
  const photos = text('draft_photos', { number: photoCount });

  if (mode === 'social') return [
    `${trip?.emoji || '🌍'} ${destination}`, '', highlights.slice(0, 2).join(' '), '', photos, '', '#WanderNote #TravelDiary',
  ].join('\n');

  if (mode === 'summary') return [
    text('draft_summary_title', { destination }), '', intro, '',
    text('draft_details', { days: trip?.days?.length || 0, notes: notes.length, photos: photoCount }), '',
    text('draft_highlights'), ...highlights.map(item => `- ${item}`), '', text('draft_ending'),
  ].join('\n');

  return [
    text('draft_story_title', { destination }), '', intro, '',
    day ? text('draft_day_intro', { date: day.date || '' }) : text('draft_trip_intro'), '',
    highlights.join('\n\n'), '', photos, '', text('draft_ending'),
  ].join('\n');
}

export function buildLocalItinerary({ destination, days = 5, style = '', translate } = {}) {
  const text = makeText(translate);
  const dest = compact(destination) || text('draft_destination_default');
  const dayCount = Math.max(1, Math.min(14, Number.parseInt(days, 10) || 5));
  const plans = Array.from({ length: dayCount }, (_, index) => [
    text('draft_plan_day', { day: index + 1, destination: dest, style: compact(style) }),
    text('draft_plan_morning'), text('draft_plan_afternoon'), text('draft_plan_evening'), text('draft_plan_tip'),
  ].join('\n')).join('\n\n');
  return [text('draft_plan_title', { destination: dest, days: dayCount }), '', text('draft_plan_notice'), '', plans].join('\n');
}

export function buildLocalPackingGroups(destination, days, translate) {
  const text = makeText(translate);
  const keys = ['documents', 'money', 'electronics', 'clothing', 'toiletries', 'special'];
  return {
    title: text('draft_packing_title', { destination: compact(destination) || text('draft_destination_default'), days: compact(days) || '5' }),
    groups: Object.fromEntries(keys.map(key => [text(`draft_packing_group_${key}`), text(`draft_packing_items_${key}`).split('\n')])),
  };
}

export function extractReadableAiText(text) {
  const clean = compact(text).replace(/```json|```/g, '').trim();
  if (!clean) return '';
  if (clean.startsWith('{') || clean.startsWith('[')) return '';
  return clean;
}
