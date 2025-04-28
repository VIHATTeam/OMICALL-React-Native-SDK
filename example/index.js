/**
 * @format
 */

import { AppRegistry, StyleSheet, Platform, View } from 'react-native';
import { name as appName } from './app.json';
import App from './src/App';
import React, { useEffect, useState } from 'react';
import { UIColors } from './src/components';
import LocalStorage from './src/local_storage';
import { startServices, configPushNotification } from 'omikit-plugin';
import { CustomLoading } from './src/components/custom_view/custom_loading';
import { LogBox } from 'react-native';
import { LoginScreen } from './src/login';

export const Main = () => {


  useEffect(() => {
    const initData = async () => {
      try {
        await startServices();
        await configPushNotification({
          notificationIcon: "calling_face",
          prefix: "Cuộc gọi tới từ: ",
          incomingBackgroundColor: "#FFFFFFFF",
          incomingAcceptButtonImage: "join_call",
          incomingDeclineButtonImage: "hangup",
          backImage: "ic_back",
          userImage: "calling_face",
          prefixMissedCallMessage: "Cuộc gọi nhỡ từ",
          missedCallTitle: "Cuộc gọi nhỡ",
          userNameKey: "uuid",
          channelId: "com.channel.sample",
          audioNotificationDescription: "",
          videoNotificationDescription: "",
          representName: ""
        });
      
      } catch (error) {
        console.error('Error initializing services:', error);
      } finally {
      }
    };

    initData();
  }, []);


  return <App />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UIColors.mainColor,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

AppRegistry.registerComponent(appName, () => Main);