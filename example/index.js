/**
 * @format
 */

import { AppRegistry } from 'react-native';
import { name as appName } from './app.json';
import React, { useEffect, useState } from 'react';
import { LogBox } from 'react-native';
import LocalStorage from './src/local_storage';
import { startServices, configPushNotification } from 'omikit-plugin';
import { App } from './src/App';

LogBox.ignoreAllLogs();

export const Main = () => {
  const [isLogin, setLogin] = useState(false);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    const checkLogin = async () => {
      const data = await LocalStorage.getString("login_info");
      await startServices();
      await configPushNotification({
        notificationIcon: 'assets_images_calling_face',
        incomingBackgroundColor: '#FFFFFFFF',
        incomingAcceptButtonImage: 'assets_images_join_call',
        incomingDeclineButtonImage: 'assets_images_hangup',
        backImage: 'assets_images_ic_back',
        userImage: 'assets_images_calling_face',
        missedCallTitle: 'Cuoc goi nho',
        prefixMissedCallMessage: 'Cuoc goi nho tu',
        userNameKey: 'full_name',
        channelId: 'com.channel.sample',
        audioNotificationDescription: 'Cuoc goi audio',
        videoNotificationDescription: 'Cuoc goi video',
        representName: 'CTY H-SOLUTIONS',
        isUserBusy: false
      });
      setLoading(false);
      setLogin(data != null);
    };

    checkLogin();
  }, []);

  if (isLoading) {
    return null;
  }

  return <App isLogin={isLogin} />;
};

AppRegistry.registerComponent(appName, () => Main);
