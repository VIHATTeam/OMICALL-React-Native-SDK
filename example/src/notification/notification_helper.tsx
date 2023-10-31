import messaging from '@react-native-firebase/messaging';
import { updateToken } from 'omikit-plugin';
import { Platform } from 'react-native';

export async function requestNotification() {
  await messaging().requestPermission();
}

export const fcm: Promise<string> = messaging().getToken();

export const apns: Promise<string | null> = messaging().getAPNSToken();

export const token = Platform.OS == "ios" ? apns : fcm;

export const prepareForUpdateToken = async () => {
  const fcmToken = await fcm;
  console.log(fcmToken);
  const apnsToken = await apns;

  // updateToken({
  //   apnsToken: apnsToken,
  //   fcmToken: fcmToken,
  // });
};
