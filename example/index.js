import { AppRegistry, StyleSheet, Platform } from 'react-native';
import { App } from './src/App';
import { name as appName } from './app.json';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import React from 'react';
import { UIColors } from './src/components';
import { localStorage } from './src/local_storage';
import { startServices, configPushNotification } from 'omikit-plugin';
import { CustomLoading } from './src/components/custom_view/custom_loading';

export const Main = () => {
  const [loading, setLoading] = useState(true);
  const [isLogin, setIsLogin] = useState(false);

  useEffect(() => {
    initData();
  }, [initData]);

  const initData = useCallback(async () => {
    // await startServices();
    if (Platform.OS === 'android') {
      configPushNotification({
        prefix: 'Cuộc gọi tới từ: ',
        declineTitle: 'Từ chối',
        acceptTitle: 'Chấp nhận',
        acceptBackgroundColor: '#FF3700B3',
        declineBackgroundColor: '#FF000000',
        incomingBackgroundColor: '#FFFFFFFF',
        incomingAcceptButtonImage: 'join_call',
        incomingDeclineButtonImage: 'hangup',
        backImage: 'ic_back',
        userImage: 'calling_face',
      });
    }
    const data = localStorage.getString('login_info');
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
    flex: 1,
    backgroundColor: UIColors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

AppRegistry.registerComponent(appName, () => Main);
