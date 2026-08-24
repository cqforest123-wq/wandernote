import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { logEvent } from './diagnostics';
import { MAX_SCHEDULED, planReminders, reminderDateFor } from './notificationSchedule';

export { planReminders, reminderDateFor };

const ENABLED_KEY = '@wandernote_departure_reminders';



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

    logEvent('reminders', 'scheduled', { count: planned.length });
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
