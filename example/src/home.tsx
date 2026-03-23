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
  omiEmitter,
  startCall,
  getProjectId,
  getAppId,
  getDeviceId,
  getFcmToken,
  getSipInfo,
  getVoipToken,
  getUserInfo,
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

  const [phone, setPhone] = useState('101');
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [sdkInfo, setSdkInfo] = useState<Record<string, string | null>>({});

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
  }, [checkInitCall, checkPermission]);

  // Register event listeners
  useEffect(() => {
    console.log('Registering call event listeners');

    const callStateSub = omiEmitter.addListener(OmiCallEvent.onCallStateChanged, onCallStateChanged);
    const missedCallSub = omiEmitter.addListener(OmiCallEvent.onClickMissedCall, onClickMissedCall);

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
