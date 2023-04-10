import { StyleSheet, View, Platform } from 'react-native';
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
} from 'omikit-plugin';
import { useNavigation } from '@react-navigation/native';
import { prepareForUpdateToken } from './notification';
import { LiveData } from './livedata';

export const HomeScreen = () => {
  ///need add call phone
  var phone = Platform.OS === 'android' ? '116' : '115';
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
      const { callerNumber } = data;
      const input = {
        callerNumber: callerNumber,
        status: CallStatus.established,
      };
      navigation.navigate('DialCall' as never, input as never);
    },
    [navigation]
  );

  useEffect(() => {
    omiEmitter.addListener(OmiCallEvent.incomingReceived, incomingReceived);
    omiEmitter.addListener(OmiCallEvent.onCallEstablished, establishedReceived);
    return () => {
      omiEmitter.removeAllListeners(OmiCallEvent.incomingReceived);
      omiEmitter.removeAllListeners(OmiCallEvent.onCallEstablished);
    };
  }, [incomingReceived, establishedReceived]);

  const call = async () => {
    // navigation.navigate('Call' as never);
    if (phone.trim().length === 0) {
      return;
    }
    const result = await startCall({ phoneNumber: phone, isVideo: false });
    if (result) {
      const data = {
        callerNumber: phone,
        isVideo: false,
        status: CallStatus.calling,
      };
      navigation.navigate('DialCall' as never, data as never);
    }
  };

  return (
    <KeyboardAvoid>
      <View style={styles.background}>
        <CustomTextField
          placeHolder="Phone number"
          keyboardType="phone-pad"
          ///need add call phone
          value={phone}
          returnKey={'done'}
          onChange={(text: string) => {
            phone = text;
          }}
        />
        <CustomCheckBox
          title="Video call"
          checked={callVideo}
          callback={_videoTrigger}
          style={styles.checkbox}
        />
        <CustomButton title="CALL" callback={call} style={styles.button} />
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
