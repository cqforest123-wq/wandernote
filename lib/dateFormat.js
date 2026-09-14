/**
 * Turning stored dates into what a reader expects.
 *
 * Dates are written into trips as `YYYY.MM.DD` for a day, `YYYY.MM` for a trip
 * month and `HH:mm` for a time. Those strings are data, not display: backups,
 * day matching, search and the watch snapshot all key on them, so they never
 * change. Every screen used to print them verbatim, which reads naturally in
 * East Asia and nowhere the app is now aimed at — "2026.04.12" to someone in
 * Boston who reads "Apr 12, 2026", or in Berlin who reads "12.04.2026".
 *
 * Nothing here imports React Native, so the formatting is tested in Node with
 * real locales. A value that does not parse is returned as it was: older or
 * hand-edited data should still show something rather than nothing.
 */

const DAY_RE = /^(\d{4})\.(\d{1,2})\.(\d{1,2})$/;
const MONTH_RE = /^(\d{4})\.(\d{1,2})$/;
const TIME_RE = /^(\d{1,2}):(\d{2})$/;

/** A local calendar date at noon, so no time zone can push it across midnight. */
function calendarDate(year, month, day) {
  const date = new Date(year, month - 1, day, 12, 0, 0, 0);

  // Reject dates the constructor silently rolls over, such as 2026.02.30.
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? date
    : null;
}

export function parseStoredDay(value) {
  const match = DAY_RE.exec(String(value ?? '').trim());
  return match ? calendarDate(Number(match[1]), Number(match[2]), Number(match[3])) : null;
}

export function parseStoredMonth(value) {
  const match = MONTH_RE.exec(String(value ?? '').trim());
  if (!match) return null;
  const month = Number(match[2]);
  return month >= 1 && month <= 12 ? calendarDate(Number(match[1]), month, 1) : null;
}

function format(date, locale, options) {
  try {
    return new Intl.DateTimeFormat(locale || undefined, options).format(date);
  } catch (e) {
    // An unsupported locale tag should not blank the screen.
    return new Intl.DateTimeFormat(undefined, options).format(date);
  }
}

/** "Apr 12, 2026" / "12 Apr 2026" / "12. Apr. 2026" / "2026年4月12日" */
export function formatStoredDay(value, locale) {
  const date = parseStoredDay(value);
  return date ? format(date, locale, { year: 'numeric', month: 'short', day: 'numeric' }) : String(value ?? '');
}

/** "Apr 2026" */
export function formatStoredMonth(value, locale) {
  const date = parseStoredMonth(value);
  return date ? format(date, locale, { year: 'numeric', month: 'short' }) : String(value ?? '');
}

/** A day or a month, whichever the stored value is. Trips carry either. */
export function formatStoredDate(value, locale) {
  if (parseStoredDay(value)) return formatStoredDay(value, locale);
  if (parseStoredMonth(value)) return formatStoredMonth(value, locale);
  return String(value ?? '');
}

/**
 * The weekday, worked out from the date.
 *
 * Days also store a weekday, but as text translated at creation — a trip made
 * while the app was in Chinese kept saying 周日 after switching to English.
 * The stored text is only the fallback for a date that cannot be read.
 */
export function formatStoredWeekday(value, locale, fallback = '') {
  const date = parseStoredDay(value);
  return date ? format(date, locale, { weekday: 'short' }) : String(fallback ?? '');
}

/** "2:05 PM" in the US, "14:05" nearly everywhere else. */
export function formatStoredTime(value, locale) {
  const match = TIME_RE.exec(String(value ?? '').trim());
  if (!match) return String(value ?? '');

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return String(value ?? '');

  const date = new Date(2000, 0, 1, hours, minutes, 0, 0);

  // A 24-hour clock pads the hour ("07:30"); a 12-hour one does not ("7:30 AM").
  // Asking for 2-digit everywhere would print "07:30 AM" in the US.
  let twentyFourHour = false;
  try {
    const resolved = new Intl.DateTimeFormat(locale || undefined, { hour: 'numeric' }).resolvedOptions();
    twentyFourHour = resolved.hour12 === false || resolved.hourCycle === 'h23' || resolved.hourCycle === 'h24';
  } catch (e) {}

  return format(date, locale, { hour: twentyFourHour ? '2-digit' : 'numeric', minute: '2-digit' });
}

/** First and last day of a trip; one date when they are the same. */
export function formatStoredDayRange(first, last, locale) {
  const from = formatStoredDay(first, locale);
  if (!last || last === first) return from;
  return `${from} – ${formatStoredDay(last, locale)}`;
}

const ISO_DAY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * A forecast column's label: the weekday, as Weather shows it.
 *
 * The forecast API speaks ISO dates, and the strip used to slice "09/15" out
 * of them — month first, which a European reader takes as the 9th of a
 * fifteenth month.
 */
export function formatForecastDay(isoDate, locale) {
  const match = ISO_DAY_RE.exec(String(isoDate ?? '').trim());
  if (!match) return String(isoDate ?? '');
  const date = calendarDate(Number(match[1]), Number(match[2]), Number(match[3]));
  return date ? format(date, locale, { weekday: 'short' }) : String(isoDate ?? '');
}
