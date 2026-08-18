import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const ENABLED_KEY = '@wandernote_departure_reminders';

/**
 * iOS keeps at most 64 pending local notifications per app and silently drops
 * the rest. Only the nearest few trips are worth a slot.
 */
const MAX_SCHEDULED = 10;

/** Reminder fires the evening before, when there is still time to pack. */
const REMIND_DAYS_BEFORE = 1;
const REMIND_HOUR = 19;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function areRemindersEnabled() {
  try {
    return (await AsyncStorage.getItem(ENABLED_KEY)) === 'true';
  } catch (e) {
    return false;
  }
}

async function setStoredEnabled(value) {
  try {
    await AsyncStorage.setItem(ENABLED_KEY, value ? 'true' : 'false');
  } catch (e) {
    console.warn('保存提醒开关失败:', e.message);
  }
}

/**
 * Ask for notification permission.
 *
 * Deliberately only ever called from the settings toggle, never at launch:
 * a permission prompt with no context is both hostile and something App Review
 * flags. Someone who never turns the switch on never sees the dialog.
 */
export async function requestPermission() {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();

    if (existing === 'granted') {
      return true;
    }

    const { status } = await Notifications.requestPermissionsAsync();

    return status === 'granted';
  } catch (e) {
    console.warn('请求通知权限失败:', e.message);
    return false;
  }
}

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

/**
 * Rebuild the schedule from scratch.
 *
 * Cancelling everything first is the only way to stay correct when a trip is
 * edited or deleted — incremental bookkeeping across app launches would drift,
 * and a reminder for a trip that no longer exists is worse than none.
 */
export async function syncDepartureReminders(trips, t, now = new Date()) {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();

    if (!(await areRemindersEnabled())) {
      return 0;
    }

    const { status } = await Notifications.getPermissionsAsync();

    if (status !== 'granted') {
      return 0;
    }

    const planned = planReminders(trips, now);

    for (const { trip, fireAt } of planned) {
      const where = [trip?.city, trip?.country].filter(Boolean).join(', ');

      await Notifications.scheduleNotificationAsync({
        content: {
          title: t('notify_departure_title'),
          body: t('notify_departure_body').replace('%s', where),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: fireAt,
        },
      });
    }

    return planned.length;
  } catch (e) {
    console.warn('安排出发提醒失败:', e.message);
    return 0;
  }
}

/**
 * Turn reminders on or off.
 * Returns the state actually reached — asking for permission can be refused,
 * in which case the switch must go back rather than pretend it worked.
 */
export async function setRemindersEnabled(enabled, trips, t) {
  if (!enabled) {
    await setStoredEnabled(false);
    await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
    return false;
  }

  const granted = await requestPermission();

  if (!granted) {
    await setStoredEnabled(false);
    return false;
  }

  await setStoredEnabled(true);
  await syncDepartureReminders(trips, t);

  return true;
}
