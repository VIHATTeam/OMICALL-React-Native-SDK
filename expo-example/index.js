import { registerRootComponent } from 'expo';
import React, { useEffect, useState } from 'react';
import { LogBox } from 'react-native';
import { startServices, configPushNotification } from 'omikit-plugin';
import LocalStorage from './src/local_storage';
import { App } from './src/App';

LogBox.ignoreAllLogs();

/**
 * Expo root component. Native OmiKit init (PushKit/CallKit, on-premise,
 * environment) is done by the Expo lifecycle subscriber inside omikit-plugin —
 * here we only start the JS-side services and register push presentation, then
 * route to Login/Home based on saved credentials. Mirrors the bare example's
 * index.js, but uses Expo's registerRootComponent instead of AppRegistry.
 */
const Main = () => {
  const [isLogin, setLogin] = useState(false);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    const checkLogin = async () => {
      const data = await LocalStorage.getString('login_info');
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
        isUserBusy: false,
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

registerRootComponent(Main);
