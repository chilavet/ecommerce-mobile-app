import { Platform } from 'react-native';

let Notifications: any = null;

if (Platform.OS !== 'web') {
  try {
    Notifications = require('expo-notifications');
    if (Notifications?.setNotificationHandler) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    }
  } catch (err) {
    console.warn('Could not initialize expo-notifications:', err);
  }
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web' || !Notifications) return false;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  } catch (err) {
    console.warn('Error requesting notification permissions:', err);
    return false;
  }
}

export async function sendLocalPushNotification(options: {
  title: string;
  body: string;
  data?: Record<string, any>;
}): Promise<boolean> {
  if (Platform.OS === 'web' || !Notifications) {
    console.log('[Notification Simulation]', options.title, '-', options.body);
    return true;
  }

  try {
    await requestNotificationPermissions();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: options.title,
        body: options.body,
        data: options.data || {},
        sound: true,
      },
      trigger: null, // immediate
    });
    return true;
  } catch (err) {
    console.warn('Failed to schedule local notification:', err);
    return false;
  }
}
