import { StyleSheet, View, Platform } from 'react-native';
import {
  CustomButton,
  CustomCheckBox,
  CustomTextField,
  KeyboardAvoid,
} from './components';
import React, { useCallback, useEffect, useState } from 'react';
import {
  // getInitialCall,
  OmiCallEvent,
  omiEmitter,
  startCall,
  logout,
  // startCallWithUuid,
  systemAlertWindow,
  openSystemAlertSetting,
  OmiCallState,
  getInitialCall,
  OmiStartCallStatus,
} from 'omikit-plugin';
import { useNavigation } from '@react-navigation/native';
import { prepareForUpdateToken } from './notification';
import { LiveData } from './livedata';
import { localStorage } from './local_storage';
import RNPermissions, {
  Permission,
  PERMISSIONS,
  check,
  checkMultiple,
  RESULTS,
  requestMultiple
} from 'react-native-permissions';

export const HomeScreen = () => {
  ///need add call phone
  // var [phone, setPhone] = useState(
  //   Platform.OS === 'android' ? '123aaa' : '124aaa'
  // );
  var [phone, setPhone] = useState(Platform.OS === 'android' ? '100' : '100');
  const navigation = useNavigation();
  const [callVideo, setCallVideo] = useState(false);

  const checkInitCall = useCallback(async () => {
    const callingInfo = await getInitialCall();
    console.log("callerNumber getInitialCall =>>>> ", callingInfo)
    if (callingInfo !== null && callingInfo !== false) {
      const { callerNumber } = callingInfo;
      console.log(callerNumber);
    }
  }, []);

  useEffect(() => {
    checkInitCall();
    checkSystemAlert();
    checkPermission()
  }, [checkInitCall]);

  const checkPermission = () => {
    checkMultiple([PERMISSIONS.IOS.MICROPHONE, PERMISSIONS.ANDROID.RECORD_AUDIO])
    .then((result) => {
      switch (result) {
        case RESULTS.UNAVAILABLE:
          requestPermission()
          console.log('This feature is not available (on this device / in this context)');
          break;
        case RESULTS.DENIED:
          requestPermission()
          console.log('The permission has not been requested / is denied but requestable');
          break;
        case RESULTS.LIMITED:
          console.log('The permission is limited: some actions are possible');
          break;
        case RESULTS.GRANTED:
          console.log('The permission is granted');
          break;
        case RESULTS.BLOCKED:
          requestPermission()
          console.log('The permission is denied and not requestable anymore');
          break;
      }
    })
    .catch((error) => {
      // …
    });
  }

  const requestPermission = () => {
    requestMultiple([PERMISSIONS.IOS.MICROPHONE, PERMISSIONS.ANDROID.RECORD_AUDIO])
    .then((result) => {
      switch (result) {
        case RESULTS.UNAVAILABLE:
          console.log('This feature is not available (on this device / in this context)');
          break;
        case RESULTS.DENIED:
          console.log('The permission has not been requested / is denied but requestable');
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
    .catch((error) => {
      // …
    });
  }

  const checkSystemAlert = async () => {
    if (Platform.OS === 'android') {
      const isAllow = await systemAlertWindow();
      if (!isAllow) {
        openSystemAlertSetting();
      }
    }
  };

  const _videoTrigger = useCallback(() => {
    setCallVideo(!callVideo);
  }, [callVideo]);

  const onCallStateChanged = useCallback(
    (data: any) => {
      console.log("data onCallStateChanged:  ", data)
      const { status, transactionId, callerNumber, isVideo } = data;
      console.log("status call: ", status);
      if (status === OmiCallState.incoming) {
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
      console.log("result ", result)
      // if (result === OmiStartCallStatus.startCallSuccess) {
      //   const param = {
      //     callerNumber: callerNumber,
      //     status: OmiCallState.calling,
      //     isOutGoingCall: true,
      //   };
      //   if (isVideo === true) {
      //     navigation.navigate('VideoCall' as never, param as never);
      //   } else {
      //     navigation.navigate('DialCall' as never, param as never);
      //   }
      // }
    },
    [navigation]
  );

  const clickMissedCall = useCallback((data: any) => {
      if (LiveData.isOpenedCall === true) {
        return;
      }
      callWithParam(data);
    },[]);

  useEffect(() => {
    omiEmitter.addListener(OmiCallEvent.onCallStateChanged, onCallStateChanged);
    omiEmitter.addListener(OmiCallEvent.onClickMissedCall, clickMissedCall);
    return () => {
      omiEmitter.removeAllListeners(OmiCallEvent.onClickMissedCall);
      omiEmitter.removeAllListeners(OmiCallEvent.onCallStateChanged);
    };
  }, []);

  const call = async () => {
    // navigation.navigate('Call' as never);
    if (phone.trim().length === 0) {
      return;
    }
    let result = await startCall({ phoneNumber: phone, isVideo: callVideo });
    console.log(":result startCall: ==>>> ", result?.status,  result)
    if(Platform.OS == "ios"){
      result = JSON.parse(result)
    }
    console.log(":result startCall: ==>>> ", result?.status)
    // if(Platform.OS == "ios" && result == 8){
    //   const data = {  
    //     callerNumber: phone,
    //     status: OmiCallState.calling,
    //     isOutGoingCall: true,
    //   };
    //   return navigation.navigate('DialCall' as never, data as never);
    // }

    if(result?.status == "4"){
      requestPermission()
    }

    if (result?.status == "8" || result?.status == 8) {
      const data = {
        callerNumber: phone,
        status: OmiCallState.calling,
        isOutGoingCall: true,
      };
      console.log("zô zzzzz: ==>>> ")

      // if (callVideo === true) {
      //   navigation.navigate('VideoCall' as never, data as never);
      // } else {
      //   navigation.navigate('DialCall' as never, data as never);
      // }

      navigation.navigate('DialCall' as never, data as never);
    } else {
      console.log("call error ==> ", result)
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
  //   if (result === OmiStartCallStatus.startCallSuccess) {
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
  //   }
  // };

  // const showAlert = (message: string) =>
  //   Alert.alert('Notification', message, [
  //     {
  //       text: 'Cancel',
  //     },
  //   ]);

  const logoutCB = async () => {
    await logout();
    localStorage.clearAll();
    // navigation.reset({ index: 0, routes: [{ name: 'LoginAPIKey' as never }] });
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
          keyboardType={"phone-pad"}
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
