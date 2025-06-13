import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { Platform, StyleSheet, View, DeviceEventEmitter } from 'react-native';
import {
  checkMultiple,
  PERMISSIONS,
  requestMultiple,
  RESULTS,
} from 'react-native-permissions';

import {
  getInitialCall,
  logout,
  // getInitialCall,
  OmiCallEvent,
  OmiCallState,
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

export const HomeScreen = () => {
  const navigation = useNavigation();

  const [phone, setPhone] = useState('101');
  const [callVideo, setCallVideo] = useState(false);

  const checkInitCall = useCallback(async () => {
    const callingInfo = await getInitialCall();
    console.log('callerNumber getInitialCall =>>>> ', callingInfo);
    if (callingInfo !== null && callingInfo !== false) {
      const { callerNumber } = callingInfo;
      console.log(callerNumber);
    }
  }, []);

  useEffect(() => {
    checkInitCall();
    checkPermission();
  }, [checkInitCall]);

  const checkPermission = () => {
    checkMultiple([
      PERMISSIONS.IOS.MICROPHONE,
      PERMISSIONS.ANDROID.RECORD_AUDIO,
      PERMISSIONS.ANDROID.CALL_PHONE,
    ])
      .then((result) => {
        switch (result) {
          case RESULTS.UNAVAILABLE:
            requestPermission();
            console.log(
              'This feature is not available (on this device / in this context)'
            );
            break;
          case RESULTS.DENIED:
            requestPermission();
            console.log(
              'The permission has not been requested / is denied but requestable'
            );
            break;
          case RESULTS.LIMITED:
            console.log('The permission is limited: some actions are possible');
            break;
          case RESULTS.GRANTED:
            console.log('The permission is granted');
            break;
          case RESULTS.BLOCKED:
            requestPermission();
            console.log('The permission is denied and not requestable anymore');
            break;
        }
      })
      .catch((error) => {
        // …
      });
  };

  const requestPermission = () => {
    requestMultiple([
      PERMISSIONS.IOS.MICROPHONE,
      PERMISSIONS.ANDROID.RECORD_AUDIO,
      PERMISSIONS.ANDROID.CALL_PHONE,
    ])
      .then((result) => {
        switch (result) {
          case RESULTS.UNAVAILABLE:
            console.log(
              'This feature is not available (on this device / in this context)'
            );
            break;
          case RESULTS.DENIED:
            console.log(
              'The permission has not been requested / is denied but requestable'
            );
            break;
          case RESULTS.LIMITED:
            console.log('The permission is limited: some actions are possible');
            break;
          case RESULTS.GRANTED:
            console.log('The permission is granted');
            break;
          case RESULTS.BLOCKED:
            console.log('The permission is denied and not requestable anymore');
            break;
        }
      })
      .catch();
  };

  const _videoTrigger = useCallback(() => {
    setCallVideo(!callVideo);
  }, [callVideo]);

  const onCallStateChanged = useCallback(
    (data: any) => {
      console.log('data onCallStateChanged:  ', data);
      const { status, callerNumber, isVideo } = data;
      console.log('status call: ', status);
      if (status == OmiCallState.incoming) {
        const input = {
          callerNumber: callerNumber,
          status: status,
          isOutGoingCall: false,
        };
        console.log(isVideo);
        if (isVideo === true) {
          navigation.navigate('VideoCall' as never, input as never);
        } else {
          navigation.navigate('DialCall' as never, input as never);
        }
      }
      if (status === OmiCallState.confirmed) {
        if (LiveData.isOpenedCall === true) {
          return;
        }
        const input = {
          callerNumber: callerNumber,
          status: status,
          isOutGoingCall: false,
        };
        if (isVideo === true) {
          navigation.navigate('VideoCall' as never, input as never);
        } else {
          navigation.navigate('DialCall' as never, input as never);
        }
      }
      if (status === OmiCallState.disconnected) {
        navigation.goBack();
      }
    },
    [navigation]
  );

  const callWithParam = useCallback(
    async (data: any) => {
      const { callerNumber, isVideo } = data;
      const result = await startCall({
        phoneNumber: callerNumber,
        isVideo: isVideo,
      });
      console.log('result callWithParam', result);
    },
    [navigation]
  );

  const clickMissedCall = useCallback((data: any) => {
    if (LiveData.isOpenedCall === true) {
      return;
    }
    callWithParam(data);
  }, []);

  useEffect(() => {


    console.log('✅ onCallStateChanged listener registered:', OmiCallEvent.onCallStateChanged);
    DeviceEventEmitter.addListener(OmiCallEvent.onCallStateChanged, onCallStateChanged);
    omiEmitter.addListener(OmiCallEvent.onClickMissedCall, clickMissedCall);
    return () => {
      omiEmitter.removeAllListeners(OmiCallEvent.onClickMissedCall);
      DeviceEventEmitter.removeAllListeners(OmiCallEvent.onCallStateChanged);
    };
  }, []);

  const call = async () => {
    if (phone.trim().length === 0) {
      return;
    }
    let result = await startCall({ phoneNumber: phone, isVideo: callVideo });
    console.log(':result startCall: ==>>> ', result?.status, result);
    if (Platform.OS == 'ios') {
      result = JSON.parse(result);
    }
    console.log(':result startCall: ==>>> ', result?.status);
    if (result?.status == '4') {
      requestPermission();
    }

    if (result?.status == '8' || result?.status == 8 || result?.status == 407) {
      const data = {
        callerNumber: phone,
        status: OmiCallState.calling,
        isOutGoingCall: true,
      };
      console.log('zô zzzzz: ==>>> ');
      navigation.navigate('DialCall' as never, data as never);
    } else {
      console.log('call error ==> ', result);
    }
  };

  const logoutCB = async () => {
    await logout();
    LocalStorage.clearAll();
    navigation.reset({ index: 0, routes: [{ name: 'Login' as never }] });
  };

  return (
    <KeyboardAvoid>
      <View style={styles.background}>
        <CustomTextField
          placeHolder="Phone number/Usr Uuid"
          ///need add call phone
          value={phone}
          returnKey={'done'}
          onChange={(text: string) => {
            setPhone(text);
          }}
          keyboardType={'phone-pad'}
        />
        <CustomCheckBox
          title="Video call"
          checked={callVideo}
          callback={_videoTrigger}
          style={styles.checkbox}
        />
        <CustomButton title="CALL" callback={call} style={styles.button} />
        <CustomButton
          title="LOG OUT"
          callback={logoutCB}
          style={styles.button}
        />
        <CustomButton
          title="TEST EVENTS"
          callback={() => navigation.navigate('TestEvents' as never)}
          style={[styles.button, { backgroundColor: '#FF9500' }]}
        />
      </View>
    </KeyboardAvoid>
  );
};

const styles = StyleSheet.create({
  background: {
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
