/**
 * When departure reminders fire.
 *
 * Kept apart from notifications.js, which imports expo-notifications and
 * AsyncStorage and therefore cannot be loaded outside the app. The scheduling
 * decisions are ordinary date arithmetic and deserve to be testable on their
 * own.
 */

/**
 * iOS keeps at most 64 pending local notifications per app and silently drops
 * the rest. Only the nearest few trips are worth a slot.
 */
export const MAX_SCHEDULED = 10;

/** Reminder fires the evening before, when there is still time to pack. */
const REMIND_DAYS_BEFORE = 1;
const REMIND_HOUR = 19;

function parsePlannedDate(value) {
  if (!value) {
    return null;
  }

  const parts = String(value).split('.').map(Number);

  if (parts.length !== 3 || parts.some(n => !Number.isFinite(n))) {
    return null;
  }

  const [year, month, day] = parts;
  const date = new Date(year, month - 1, day);

  return Number.isNaN(date.getTime()) ? null : date;
}

/** When to fire for a given departure, or null if that moment has passed. */
export function reminderDateFor(plannedDate, now = new Date()) {
  const departure = parsePlannedDate(plannedDate);

  if (!departure) {
    return null;
  }

  const fireAt = new Date(departure);
  fireAt.setDate(fireAt.getDate() - REMIND_DAYS_BEFORE);
  fireAt.setHours(REMIND_HOUR, 0, 0, 0);

  return fireAt > now ? fireAt : null;
}

export function planReminders(trips, now = new Date()) {
  return (trips || [])
    .map(trip => {
      const fireAt = reminderDateFor(trip?.plannedDate, now);

      return fireAt ? { trip, fireAt } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.fireAt - b.fireAt)
    .slice(0, MAX_SCHEDULED);
}
