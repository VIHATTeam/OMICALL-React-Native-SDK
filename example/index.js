/**
 * @format
 */

import { AppRegistry, StyleSheet, Platform, View } from 'react-native';
import { name as appName } from './app.json';
import { App } from './src/App';
import React, { useEffect, useState } from 'react';
import { UIColors } from './src/components';
import LocalStorage from './src/local_storage';
import { startServices, configPushNotification } from 'omikit-plugin';
import { CustomLoading } from './src/components/custom_view/custom_loading';
import { LogBox } from 'react-native';
import { LoginScreen } from './src/login';
export const Main = () => {
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(false);

  useEffect(() => {
    const initData = async () => {
      try {
        startServices();
        if (Platform.OS == 'android' ){
          configPushNotification({
            notificationIcon: 'assets_images_calling_face',
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
            representName: 'CTY H-SOLUTIONS',
          });
        }
        const data = await LocalStorage.getString("login_info");
        console.log('data login_info ==> ', data, data != undefined);
        if (data != undefined){
          setIsLogin(true);
        }
      } catch (error) {
        console.error('Error during initialization:', error);
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, []);


  LogBox.ignoreAllLogs();

  return loading ? (
    <View style={styles.loading}>
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