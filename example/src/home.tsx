import { StyleSheet, View } from 'react-native';
import { CustomButton, CustomTextField, KeyboardAvoid } from './components';
import React, { useCallback, useEffect } from 'react';
import { OmiCallEvent, omiEmitter, startCall } from 'omikit-plugin';
import { useNavigation } from '@react-navigation/native';
import { prepareForUpdateToken } from './notification';

export const HomeScreen = () => {
  ///need add call phone
  var phone = '';
  const navigation = useNavigation();

  useEffect(() => {
    prepareForUpdateToken();
  }, []);

  const incomingReceived = useCallback(
    (data: any) => {
      console.log('incomingReceived');
      console.log(data);
      // const { isVideo, callerNumber, isIncoming } = data;
      navigation.navigate('DialCall' as never, data as never);
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
      navigation.navigate('Call' as never);
    }
  };

  return (
    <KeyboardAvoid>
      <View style={styles.background}>
        <CustomTextField
          placeHolder="Phone number"
          keyboardType="phone-pad"
          ///need add call phone
          value=""
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
