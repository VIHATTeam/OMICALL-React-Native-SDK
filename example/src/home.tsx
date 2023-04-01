import { StyleSheet, View } from 'react-native';
import {
  CallStatus,
  CustomButton,
  CustomTextField,
  KeyboardAvoid,
} from './components';
import React, { useCallback, useEffect } from 'react';
import {
  getInitialCall,
  OmiCallEvent,
  omiEmitter,
  startCall,
} from 'omikit-plugin';
import { useNavigation } from '@react-navigation/native';
import { prepareForUpdateToken } from './notification';

export const HomeScreen = () => {
  ///need add call phone
  var phone = '112';
  const navigation = useNavigation();

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

  const incomingReceived = useCallback(
    (data: any) => {
      console.log('incomingReceived');
      console.log(data);

      const { callerNumber } = data;
      const input = {
        callerNumber: callerNumber,
        status: CallStatus.ringing,
      };
      navigation.navigate('DialCall' as never, input as never);
    },
    [navigation]
  );

  useEffect(() => {
    omiEmitter.addListener(OmiCallEvent.incomingReceived, incomingReceived);
    return () => {
      omiEmitter.removeAllListeners(OmiCallEvent.incomingReceived);
    };
  }, [incomingReceived]);

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
  button: {
    marginTop: 24,
  },
});
