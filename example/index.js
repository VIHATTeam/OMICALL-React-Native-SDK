import { AppRegistry, StyleSheet, Platform } from 'react-native';
import { App } from './src/App';
import { name as appName } from './app.json';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import React from 'react';
import { UIColors } from './src/components';
import LocalStorage from './src/local_storage';
import { startServices, configPushNotification } from 'omikit-plugin';
import { CustomLoading } from './src/components/custom_view/custom_loading';
import { LogBox } from 'react-native';

export const Main = () => {
  const [loading, setLoading] = useState(true);
  const [isLogin, setIsLogin] = useState(false);

  useEffect(() => {
    initData();
  }, [initData]);

  const initData = useCallback(async () => {
    startServices();
    configPushNotification({
      notificationIcon: 'assets_images_calling_face',
      prefix: '',
      incomingBackgroundColor: '#FFFFFFFF',
      incomingAcceptButtonImage: 'assets_images_join_call',
      incomingDeclineButtonImage: 'assets_images_hangup',
      backImage: 'assets_images_ic_back',
      userImage: 'assets_images_calling_face',
      missedCallTitle: 'Cuộc gọi nhớ',
      prefixMissedCallMessage: 'Cuộc gọi nhỡ từ',
      userNameKey: 'full_name',
      channelId: 'com.channel.sample',
      audioNotificationDescription: 'Cuộc gọi audio nè',
      videoNotificationDescription: 'Cuộc gọi video nè',
    });
    const data = await LocalStorage.getString('login_info');
    console.log("data login_info ==>  ", data, data != undefined)
    const isLogin = data !== undefined;

    // if (haveLoginInfo) {
    // await initCall({
    //   isVideo: true,
    // });
    // await prepareForUpdateToken();
    // }
    setIsLogin(isLogin);
    setLoading(false);
  }, []);

  //turn off warning
  LogBox.ignoreAllLogs();

  return loading === true ? (
    <View styles={styles.loading}>
      <CustomLoading />
    </View>
  ) : (
    <App isLogin={isLogin} />
  );
};

const styles = StyleSheet.create({
  loading: {
    width: '100%',
    height: '100%',
    backgroundColor: UIColors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

AppRegistry.registerComponent(appName, () => Main);
