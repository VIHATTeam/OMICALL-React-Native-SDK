import { StyleSheet, View } from 'react-native';
import { KeyboardAvoid } from './components';
import React, { useEffect } from 'react';
import { apns, fcm } from './notification';
import DeviceInfo from 'react-native-device-info';
import { updateToken } from 'omikit-plugin';

export const HomeScreen = () => {
  useEffect(() => {
    prepareForUpdateToken();
  }, []);

  const prepareForUpdateToken = async () => {
    const fcmToken = await fcm;
    console.log(fcmToken);
    const apnsToken = await apns;

    const deviceId = DeviceInfo.getDeviceId;
    updateToken({
      apnsToken: apnsToken,
      fcmToken: fcmToken,
      deviceId: deviceId,
    });
  };

  return (
    <KeyboardAvoid>
      <View style={styles.background}></View>
    </KeyboardAvoid>
  );
};

const styles = StyleSheet.create({
  background: {},
});
