import { getLocales } from 'expo-localization';
import i18n from '../i18n';
import {
  formatForecastDay,
  formatStoredDate,
  formatStoredDay,
  formatStoredDayRange,
  formatStoredMonth,
  formatStoredTime,
  formatStoredWeekday,
} from './dateFormat';

/**
 * The locale to format dates in: the app's language with the device's region.
 *
 * The language alone gets ordering wrong — English UI on a German iPhone should
 * still read day-first. The region alone gets words wrong — a German iPhone
 * with the app switched to French should say "avr.", not "Apr.". Screens re-
 * mount when the language changes, so reading this at render time is enough.
 */
export function displayLocale() {
  const language = String(i18n.language || 'en').split(/[-_]/)[0];
  let region = null;

  try {
    region = getLocales()?.[0]?.regionCode || null;
  } catch (e) {}

  return region ? `${language}-${region}` : language;
}

export const displayDay = value => formatStoredDay(value, displayLocale());
export const displayMonth = value => formatStoredMonth(value, displayLocale());
export const displayDate = value => formatStoredDate(value, displayLocale());
export const displayWeekday = (value, fallback) => formatStoredWeekday(value, displayLocale(), fallback);
export const displayTime = value => formatStoredTime(value, displayLocale());
export const displayDayRange = (first, last) => formatStoredDayRange(first, last, displayLocale());
export const displayForecastDay = isoDate => formatForecastDay(isoDate, displayLocale());
