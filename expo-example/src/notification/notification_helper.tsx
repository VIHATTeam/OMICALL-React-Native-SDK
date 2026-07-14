import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';

/**
 * Push tokens for the Expo example (same setup as the bare RN example).
 *
 * Android relies on FCM to wake the app for INBOUND calls, so we fetch the real
 * FCM token via `@react-native-firebase/messaging` and hand it to the SDK on
 * login. The `@react-native-firebase/app` config plugin + `googleServicesFile`
 * in app.json wire the native Firebase setup during `expo prebuild`.
 *
 * iOS receives inbound calls over PushKit (handled natively by the OmiKit Expo
 * bridge), so the APNs token here is optional — kept for parity with the SDK's
 * updateToken API.
 */

export async function requestNotification(): Promise<void> {
  await messaging().requestPermission();
}

export const fcm: Promise<string> = messaging().getToken();

export const apns: Promise<string | null> = messaging().getAPNSToken();

export const token = Platform.OS === 'ios' ? apns : fcm;

export const prepareForUpdateToken = async (): Promise<void> => {
  const fcmToken = await fcm;
  const apnsToken = await apns;
  console.log('[EXPO_EXAMPLE] push tokens:', { fcmToken, apnsToken });
};
