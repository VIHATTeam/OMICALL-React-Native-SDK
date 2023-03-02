import { StyleSheet, View } from 'react-native';
import { CustomButton, CustomTextField, KeyboardAvoid } from './components';
import React, { useEffect } from 'react';
import { apns, fcm } from './notification';
import DeviceInfo from 'react-native-device-info';
import { startCall, updateToken } from 'omikit-plugin';
import { useNavigation } from '@react-navigation/native';

export const HomeScreen = () => {
  var phone = '';
  const navigation = useNavigation();

  useEffect(() => {
    prepareForUpdateToken();
  }, []);

  const prepareForUpdateToken = async () => {
    const fcmToken = await fcm;
    console.log(fcmToken);
    const apnsToken = await apns;

    const deviceId = DeviceInfo.getDeviceId();
    const appId = DeviceInfo.getBundleId();
    updateToken({
      apnsToken: apnsToken,
      fcmToken: fcmToken,
      deviceId: deviceId,
      appId: appId,
    });
  };

  const call = async () => {
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
