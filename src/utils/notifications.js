import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { getSettings, saveSettings, getStreak } from './storage';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
  }),
});

// Request permission
export async function requestNotificationPermission() {
  if (!Device.isDevice) return false;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Lernerinnerungen',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: null,
    });
  }

  return true;
}

// Schedule daily reminder notification
export async function scheduleDailyReminder() {
  // Cancel existing reminders first
  await cancelAllReminders();

  const settings = await getSettings();
  if (settings.notificationsEnabled === false) return;

  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  // Evening reminder at 19:00 - "Hast du heute schon gelernt?"
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'BQ Prüfung',
      body: 'Hast du heute schon gelernt? Halte deine Streak aufrecht!',
      sound: null,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 19,
      minute: 0,
    },
  });

  // Morning motivation at 8:00
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Guten Morgen!',
      body: 'Starte den Tag mit ein paar BQ-Fragen.',
      sound: null,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 8,
      minute: 0,
    },
  });
}

// Cancel when daily goal is reached
export async function cancelTodayReminder() {
  // We keep the schedule but could set badge to 0
  await Notifications.setBadgeCountAsync(0);
}

// Cancel all scheduled notifications
export async function cancelAllReminders() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Update notifications based on streak
export async function updateStreakNotification() {
  const streak = await getStreak();
  const settings = await getSettings();

  if (settings.notificationsEnabled === false) return;
  if (streak.todayCount >= streak.dailyGoal) {
    // Goal reached - clear badge
    await Notifications.setBadgeCountAsync(0);
  } else {
    // Set badge to remaining questions
    const remaining = streak.dailyGoal - streak.todayCount;
    await Notifications.setBadgeCountAsync(remaining);
  }
}

// Initialize notifications on app start
export async function initNotifications() {
  const settings = await getSettings();

  // First launch - ask for permission and enable
  if (settings.notificationsEnabled === undefined) {
    const granted = await requestNotificationPermission();
    await saveSettings({ notificationsEnabled: granted });
    if (granted) {
      await scheduleDailyReminder();
    }
  } else if (settings.notificationsEnabled) {
    await scheduleDailyReminder();
  }

  await updateStreakNotification();
}

// Toggle notifications on/off
export async function toggleNotifications(enabled) {
  await saveSettings({ notificationsEnabled: enabled });
  if (enabled) {
    const granted = await requestNotificationPermission();
    if (granted) {
      await scheduleDailyReminder();
    }
    return granted;
  } else {
    await cancelAllReminders();
    await Notifications.setBadgeCountAsync(0);
    return false;
  }
}
