import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { Platform, StyleSheet, View, DeviceEventEmitter, Text, ScrollView, Alert } from 'react-native';
import {
  check,
  request,
  PERMISSIONS,
  RESULTS,
  Permission,
} from 'react-native-permissions';

import {
  getInitialCall,
  logout,
  OmiCallEvent,
  OmiCallState,
  OmiStartCallStatus,
  startCall,
  getProjectId,
  getAppId,
  getDeviceId,
  getFcmToken,
  getSipInfo,
  getVoipToken,
  getUserInfo,
  getOmiDevices,
  isCurrentDeviceRegistered,
  needsReLogin,
} from 'omikit-plugin';

import { LiveData } from './livedata';
import LocalStorage from './local_storage';

import {
  CustomButton,
  CustomCheckBox,
  CustomTextField,
  KeyboardAvoid,
} from './components';

// Permission constants based on platform
const MICROPHONE_PERMISSION: Permission = Platform.select({
  ios: PERMISSIONS.IOS.MICROPHONE,
  android: PERMISSIONS.ANDROID.RECORD_AUDIO,
}) as Permission;

export const HomeScreen = () => {
  const navigation: any = useNavigation();

  const [phone, setPhone] = useState('100');
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [sdkInfo, setSdkInfo] = useState<Record<string, string | null>>({});
  const [deviceCheckInfo, setDeviceCheckInfo] = useState<{
    devices: any[];
    registered: boolean | null;
    needsRelogin: boolean | null;
    localDeviceId: string | null;
    localAppId: string | null;
  } | null>(null);

  // Fetch all getter function results
  const fetchSdkInfo = async () => {
    try {
      const [projectId, appId, deviceId, fcmToken, sipInfo, voipToken] = await Promise.all([
        getProjectId(),
        getAppId(),
        getDeviceId(),
        getFcmToken(),
        getSipInfo(),
        getVoipToken(),
      ]);
      const info = { projectId, appId, deviceId, fcmToken, sipInfo, voipToken };
      console.log('SDK Info:', info);
      setSdkInfo(info);
    } catch (error) {
      console.log('fetchSdkInfo error:', error);
      Alert.alert('Error', String(error));
    }
  };

  // Force logout — used when device registration is stale (needsReLogin === true).
  // Local SIP user exists but backend has no matching device entry, so PBX will
  // never push incoming calls to this device. Only safe recovery is re-login.
  const forceLogoutForRelogin = useCallback(async () => {
    try {
      console.log('[DEVICE_CHECK] Forcing logout for re-login...');
      await logout();
      LocalStorage.clearAll();
    } catch (e) {
      console.log('[DEVICE_CHECK] forceLogout error:', e);
    } finally {
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    }
  }, [navigation]);

  // Verify the local SIP session is still registered on the OMI backend.
  // Call after every login and on app foreground — if the user reinstalled the
  // app or the backend cleaned up the device record, the local session is stale
  // and the PBX will never route incoming calls here.
  const runDeviceCheck = useCallback(
    async (opts: { showAlertOnPass?: boolean } = {}) => {
      try {
        console.log('[DEVICE_CHECK] === AFTER LOGIN (Home screen) ===');
        const localDeviceId = await getDeviceId();
        const localAppId = await getAppId();
        console.log('[DEVICE_CHECK] localDeviceId:', localDeviceId);
        console.log('[DEVICE_CHECK] localAppId:', localAppId);

        const devices = await getOmiDevices();
        console.log('[DEVICE_CHECK] getOmiDevices() count:', devices.length);
        console.log('[DEVICE_CHECK] getOmiDevices() payload:', JSON.stringify(devices, null, 2));

        const registered = await isCurrentDeviceRegistered();
        console.log('[DEVICE_CHECK] isCurrentDeviceRegistered:', registered);

        const needsRelogin = await needsReLogin();
        console.log('[DEVICE_CHECK] needsReLogin:', needsRelogin);

        setDeviceCheckInfo({
          devices,
          registered,
          needsRelogin,
          localDeviceId,
          localAppId,
        });

        if (needsRelogin) {
          // SIP user is set locally but backend has no matching device entry.
          // Show alert and force re-login — there is no other recovery path.
          Alert.alert(
            'Session stale — please log in again',
            `Local device (${localDeviceId ?? 'unknown'} / ${localAppId ?? 'unknown'}) ` +
              `was not found on the backend for the current SIP user.\n\n` +
              `You will be logged out so you can sign in again.`,
            [
              { text: 'Log out & re-login', onPress: forceLogoutForRelogin },
            ],
            { cancelable: false }
          );
        } else if (opts.showAlertOnPass) {
          Alert.alert(
            'Device Check OK',
            `localDeviceId: ${localDeviceId ?? 'null'}\n` +
              `localAppId: ${localAppId ?? 'null'}\n` +
              `devices on backend: ${devices.length}\n` +
              `isCurrentDeviceRegistered: ${registered}\n` +
              `needsReLogin: ${needsRelogin}`
          );
        }
      } catch (error) {
        console.log('[DEVICE_CHECK] Error:', error);
        if (opts.showAlertOnPass) {
          Alert.alert('Device Check Error', String(error));
        }
      }
    },
    [forceLogoutForRelogin]
  );

  // Fetch user info by phone number
  const fetchUserInfo = async () => {
    const phoneNumber = phone.trim();
    if (!phoneNumber) return;
    try {
      const result = await getUserInfo(phoneNumber);
      console.log('getUserInfo result:', result);
      Alert.alert('User Info', JSON.stringify(result, null, 2));
    } catch (error) {
      console.log('getUserInfo error:', error);
      Alert.alert('Error', String(error));
    }
  };

  // Check for initial call when app opens from killed state
  const checkInitCall = useCallback(async () => {
    const callingInfo = await getInitialCall();
    console.log('getInitialCall:', callingInfo);

    if (callingInfo && callingInfo !== false) {
      const { callerNumber } = callingInfo as any;
      console.log('Initial call from:', callerNumber);
    }
  }, []);

  // Check and request microphone permission
  const checkPermission = useCallback(async () => {
    try {
      const result = await check(MICROPHONE_PERMISSION);
      console.log('Permission check result:', result);

      if (result === RESULTS.DENIED || result === RESULTS.BLOCKED) {
        await requestPermission();
      }
    } catch (error) {
      console.log('Permission check error:', error);
    }
  }, []);

  const requestPermission = async () => {
    try {
      const result = await request(MICROPHONE_PERMISSION);
      console.log('Permission request result:', result);

      switch (result) {
        case RESULTS.UNAVAILABLE:
          console.log('This feature is not available on this device');
          break;
        case RESULTS.DENIED:
          console.log('The permission has been denied');
          break;
        case RESULTS.LIMITED:
          console.log('The permission is limited');
          break;
        case RESULTS.GRANTED:
          console.log('The permission is granted');
          break;
        case RESULTS.BLOCKED:
          console.log('The permission is blocked');
          break;
      }
    } catch (error) {
      console.log('Permission request error:', error);
    }
  };

  // Navigate to call screen based on call type
  const navigateToCallScreen = useCallback(
    (callerNumber: string, status: number, isOutgoing: boolean, isVideo: boolean) => {
      const params = { callerNumber, status, isOutGoingCall: isOutgoing };
      const screen = isVideo ? 'VideoCall' : 'DialCall';
      navigation.navigate(screen, params);
    },
    [navigation]
  );

  // Handle call state changes from native SDK
  const onCallStateChanged = useCallback(
    (data: any) => {
      console.log('onCallStateChanged:', data);
      const { status, callerNumber, isVideo } = data;

      if (status === OmiCallState.incoming) {
        // Skip if already on a call screen — prevents double navigation
        // (SDK may fire incoming twice: first with isVideo=false, then isVideo=true)
        if (LiveData.isOpenedCall) return;
        navigateToCallScreen(callerNumber, status, false, isVideo === true);
      }

      if (status === OmiCallState.confirmed && !LiveData.isOpenedCall) {
        navigateToCallScreen(callerNumber, status, false, isVideo === true);
      }

      // Disconnected handled by call screens (VideoCall/DialCall) — not here
      // Home only handles incoming/confirmed navigation
    },
    [navigation, navigateToCallScreen]
  );

  // Handle missed call click from notification
  const onClickMissedCall = useCallback(
    async (data: any) => {
      if (LiveData.isOpenedCall) {
        return;
      }

      const { callerNumber, isVideo } = data;
      const result = await startCall({
        phoneNumber: callerNumber,
        isVideo: isVideo,
      });
      console.log('Call from missed notification result:', result);
    },
    []
  );

  // Initialize screen
  useEffect(() => {
    checkInitCall();
    checkPermission();
    // Verify backend device registration once after login lands on Home.
    // If needsReLogin === true, user will be alerted and forced back to Login.
    runDeviceCheck();
  }, [checkInitCall, checkPermission, runDeviceCheck]);

  // Register event listeners on the global DeviceEventEmitter — the JS
  // counterpart of native RCTDeviceEventEmitter that the SDK emits on.
  useEffect(() => {
    const callStateSub = DeviceEventEmitter.addListener(
      OmiCallEvent.onCallStateChanged,
      onCallStateChanged
    );
    const missedCallSub = DeviceEventEmitter.addListener(
      OmiCallEvent.onClickMissedCall,
      onClickMissedCall
    );

    return () => {
      callStateSub.remove();
      missedCallSub.remove();
    };
  }, [onCallStateChanged, onClickMissedCall]);

  // Handle call button press
  const handleCall = async () => {
    const phoneNumber = phone.trim();
    if (phoneNumber.length === 0) {
      return;
    }

    let result: any = await startCall({ phoneNumber, isVideo: isVideoCall });
    console.log('startCall result:', result);

    // Parse JSON string response on iOS
    if (Platform.OS === 'ios' && typeof result === 'string') {
      result = JSON.parse(result);
    }

    const status = Number(result?.status);

    // Handle permission denied
    if (status === OmiStartCallStatus.permissionDenied) {
      requestPermission();
      return;
    }

    // Handle call initiated successfully
    if (status === OmiStartCallStatus.startCallSuccess || status === OmiStartCallStatus.startCallSuccessIOS) {
      navigateToCallScreen(phoneNumber, OmiCallState.calling, true, isVideoCall);
    } else {
      console.log('Call failed with status:', status, result);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    await logout();
    LocalStorage.clearAll();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  return (
    <KeyboardAvoid>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <CustomTextField
          placeHolder="Phone number/Usr Uuid"
          value={phone}
          returnKey="done"
          onChange={setPhone}
          keyboardType="phone-pad"
        />
        <CustomCheckBox
          title="Video call"
          checked={isVideoCall}
          callback={() => setIsVideoCall(!isVideoCall)}
          style={styles.checkbox}
        />
        <CustomButton
          title="CALL"
          callback={handleCall}
          style={styles.button}
        />

        {/* Getter Functions Test Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Getter Functions</Text>
          <CustomButton
            title="GET SDK INFO"
            callback={fetchSdkInfo}
            style={styles.button}
          />
          <CustomButton
            title="GET USER INFO"
            callback={fetchUserInfo}
            style={styles.button}
          />

          {Object.keys(sdkInfo).length > 0 && (
            <View style={styles.infoBox}>
              {Object.entries(sdkInfo).map(([key, value]) => (
                <View key={key} style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{key}:</Text>
                  <Text style={styles.infoValue} selectable>
                    {value ?? 'null'}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Device Registration Check Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Device Registration Check</Text>
          <Text style={styles.sectionHint}>
            Auto-checked on mount. Verifies this device is still registered on
            the OMI backend for the current SIP user. If not, you will be
            forced to log out and log in again.
          </Text>
          <CustomButton
            title="RE-CHECK DEVICE REGISTRATION"
            callback={() => runDeviceCheck({ showAlertOnPass: true })}
            style={styles.button}
          />

          {deviceCheckInfo && (
            <View style={styles.infoBox}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>localDeviceId:</Text>
                <Text style={styles.infoValue} selectable>
                  {deviceCheckInfo.localDeviceId ?? 'null'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>localAppId:</Text>
                <Text style={styles.infoValue} selectable>
                  {deviceCheckInfo.localAppId ?? 'null'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>devices:</Text>
                <Text style={styles.infoValue} selectable>
                  {deviceCheckInfo.devices.length}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>registered:</Text>
                <Text
                  style={[
                    styles.infoValue,
                    { color: deviceCheckInfo.registered ? '#28a745' : '#dc3545' },
                  ]}
                  selectable
                >
                  {String(deviceCheckInfo.registered)}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>needsReLogin:</Text>
                <Text
                  style={[
                    styles.infoValue,
                    { color: deviceCheckInfo.needsRelogin ? '#dc3545' : '#28a745' },
                  ]}
                  selectable
                >
                  {String(deviceCheckInfo.needsRelogin)}
                </Text>
              </View>
            </View>
          )}
        </View>

        <CustomButton
          title="LOG OUT"
          callback={handleLogout}
          style={styles.button}
        />
      </ScrollView>
    </KeyboardAvoid>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 48,
  },
  checkbox: {
    marginTop: 24,
  },
  button: {
    marginTop: 24,
  },
  section: {
    marginTop: 32,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  sectionHint: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  infoBox: {
    marginTop: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontWeight: '600',
    color: '#555',
    width: 90,
    fontSize: 12,
  },
  infoValue: {
    flex: 1,
    color: '#222',
    fontSize: 12,
  },
});
