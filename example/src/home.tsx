import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { Platform, StyleSheet, View, DeviceEventEmitter } from 'react-native';
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
        navigateToCallScreen(callerNumber, status, false, isVideo === true);
      }

      if (status === OmiCallState.confirmed && !LiveData.isOpenedCall) {
        navigateToCallScreen(callerNumber, status, false, isVideo === true);
      }

      if (status === OmiCallState.disconnected) {
        navigation.goBack();
      }
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

    DeviceEventEmitter.addListener(OmiCallEvent.onCallStateChanged, onCallStateChanged);
    omiEmitter.addListener(OmiCallEvent.onClickMissedCall, onClickMissedCall);

    return () => {
      omiEmitter.removeAllListeners(OmiCallEvent.onClickMissedCall);
      DeviceEventEmitter.removeAllListeners(OmiCallEvent.onCallStateChanged);
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
      <View style={styles.container}>
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
        <CustomButton
          title="LOG OUT"
          callback={handleLogout}
          style={styles.button}
        />
      </View>
    </KeyboardAvoid>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    flex: 1,
  },
  checkbox: {
    marginTop: 24,
  },
  button: {
    marginTop: 24,
  },
});
