import { AppRegistry, StyleSheet } from 'react-native';
import { App } from './src/App';
import { name as appName } from './app.json';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import React from 'react';
import { UIColors } from './src/components';
import { localStorage } from './src/local_storage';
import { initCall, getInitialCall } from 'omikit-plugin';
import { prepareForUpdateToken } from './src/notification';
import { CustomLoading } from './src/components/custom_view/custom_loading';

export const Main = () => {
  const [loading, setLoading] = useState(true);
  const [isLogin, setIsLogin] = useState(false);

  useEffect(() => {
    initData();
  }, [initData]);

  const initData = useCallback(async () => {
    const data = localStorage.getString('login_info');
    const haveLoginInfo = data !== undefined;
    if (haveLoginInfo) {
      await initCall({});
      await prepareForUpdateToken();
    }
    setIsLogin(haveLoginInfo);
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
