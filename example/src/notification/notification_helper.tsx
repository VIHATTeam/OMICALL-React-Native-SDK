import messaging from '@react-native-firebase/messaging';

export async function requestNotification() {
  await messaging().requestPermission();
}

export const fcm: Promise<string> = messaging().getToken();

export const apns: Promise<string | null> = messaging().getAPNSToken();
