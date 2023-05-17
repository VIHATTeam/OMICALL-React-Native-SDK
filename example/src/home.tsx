import { StyleSheet, View, Platform, Alert } from 'react-native';
import {
  CallStatus,
  CustomButton,
  CustomCheckBox,
  CustomTextField,
  KeyboardAvoid,
} from './components';
import React, { useCallback, useEffect, useState } from 'react';
import {
  getInitialCall,
  OmiCallEvent,
  omiEmitter,
  startCall,
  logout,
  startCallWithUuid,
} from 'omikit-plugin';
import { useNavigation } from '@react-navigation/native';
import { prepareForUpdateToken } from './notification';
import { LiveData } from './livedata';
import { localStorage } from './local_storage';
import RNPermissions, {
  Permission,
  PERMISSIONS,
} from 'react-native-permissions';

export const HomeScreen = () => {
  ///need add call phone
  var [phone, setPhone] = useState(
    Platform.OS === 'android' ? '123aaa' : '124aaa'
  );
  // var [phone, setPhone] = useState(Platform.OS === 'android' ? '110' : '111');
  const navigation = useNavigation();
  const [callVideo, setCallVideo] = useState(true);

  const checkInitCall = useCallback(async () => {
    const callingInfo = await getInitialCall();
    if (callingInfo !== false) {
      // const { callerNumber, muted, status } = callingInfo;
      navigation.navigate('DialCall' as never, callingInfo as never);
    }
  }, [navigation]);

  useEffect(() => {
    prepareForUpdateToken();
    checkInitCall();
  }, [checkInitCall]);

  const _videoTrigger = useCallback(() => {
    setCallVideo(!callVideo);
  }, [callVideo]);

  const incomingReceived = useCallback(
    (data: any) => {
      console.log('incomingReceived');
      console.log(data);
      const { callerNumber, isVideo } = data;
      const input = {
        callerNumber: callerNumber,
        status: CallStatus.ringing,
      };
      console.log(isVideo);
      if (isVideo === true) {
        navigation.navigate('VideoCall' as never, input as never);
      } else {
        navigation.navigate('DialCall' as never, input as never);
      }
    },
    [navigation]
  );

  const establishedReceived = useCallback(
    (data: any) => {
      console.log(LiveData.isOpenedCall);
      if (LiveData.isOpenedCall === true) {
        return;
      }
      console.log('establishedReceived');
      console.log(data);
      const { callerNumber, isVideo } = data;
      const input = {
        callerNumber: callerNumber,
        status: CallStatus.established,
      };
      if (isVideo === true) {
        navigation.navigate('VideoCall' as never, input as never);
      } else {
        navigation.navigate('DialCall' as never, input as never);
      }
    },
    [navigation]
  );

  const onCallEnd = useCallback((data: any) => {
    console.log(data);
  }, []);

  const callWithParam = useCallback(
    async (data: any) => {
      const { callerNumber, isVideo } = data;
      const result = await startCall({
        phoneNumber: callerNumber,
        isVideo: isVideo,
      });
      if (result) {
        const param = {
          callerNumber: callerNumber,
          status: CallStatus.calling,
        };
        if (isVideo === true) {
          navigation.navigate('VideoCall' as never, param as never);
        } else {
          navigation.navigate('DialCall' as never, param as never);
        }
      }
    },
    [navigation]
  );

  const clickMissedCall = useCallback(
    (data: any) => {
      if (LiveData.isOpenedCall === true) {
        return;
      }
      callWithParam(data);
    },
    [callWithParam]
  );

  useEffect(() => {
    omiEmitter.addListener(OmiCallEvent.incomingReceived, incomingReceived);
    omiEmitter.addListener(OmiCallEvent.onCallEstablished, establishedReceived);
    omiEmitter.addListener(OmiCallEvent.onCallEnd, onCallEnd);
    omiEmitter.addListener(OmiCallEvent.onClickMissedCall, clickMissedCall);
    return () => {
      omiEmitter.removeAllListeners(OmiCallEvent.incomingReceived);
      omiEmitter.addListener(OmiCallEvent.onCallEnd, onCallEnd);
      omiEmitter.removeAllListeners(OmiCallEvent.onCallEstablished);
      omiEmitter.removeAllListeners(OmiCallEvent.onClickMissedCall);
    };
  }, [incomingReceived, establishedReceived, clickMissedCall, onCallEnd]);

  const call = async () => {
    // navigation.navigate('Call' as never);
    if (phone.trim().length === 0) {
      return;
    }
    const result = await startCall({ phoneNumber: phone, isVideo: callVideo });
    if (result) {
      const data = {
        callerNumber: phone,
        status: CallStatus.calling,
      };
      if (callVideo === true) {
        navigation.navigate('VideoCall' as never, data as never);
      } else {
        navigation.navigate('DialCall' as never, data as never);
      }
    }
  };

  // const call = async () => {
  //   // navigation.navigate('Call' as never);
  //   if (phone.trim().length === 0) {
  //     return;
  //   }
  //   const result = await startCallWithUuid({
  //     usrUuid: phone,
  //     isVideo: callVideo,
  //   });
  //   console.log(result);
  //   if (result) {
  //     const data = {
  //       callerNumber: phone,
  //       status: CallStatus.calling,
  //     };
  //     if (callVideo === true) {
  //       navigation.navigate('VideoCall' as never, data as never);
  //     } else {
  //       navigation.navigate('DialCall' as never, data as never);
  //     }
  //   } else {
  //     console.log('faaaaaaa');
  //     const PLATFORM_PERMISSIONS = Platform.select<
  //       typeof PERMISSIONS.ANDROID | typeof PERMISSIONS.IOS | {}
  //     >({
  //       android: PERMISSIONS.ANDROID.RECORD_AUDIO,
  //       ios: PERMISSIONS.IOS.MICROPHONE,
  //       default: {},
  //     });
  //     const PERMISSIONS_VALUES: Permission[] =
  //       Object.values(PLATFORM_PERMISSIONS);
  //     const audioPermission = PERMISSIONS_VALUES[0];
  //     if (audioPermission) {
  //       const value = await RNPermissions.check(audioPermission);
  //       console.log(value);
  //       if (value !== 'granted') {
  //         showAlert('Check audio permission!');
  //       }
  //     }
  //   }
  // };

  const showAlert = (message: string) =>
    Alert.alert('Notification', message, [
      {
        text: 'Cancel',
      },
    ]);

  const logoutCB = async () => {
    await logout();
    localStorage.clearAll();
    navigation.reset({ index: 0, routes: [{ name: 'LoginAPIKey' as never }] });
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
