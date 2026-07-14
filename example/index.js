/**
 * @format
 */

import { AppRegistry, TurboModuleRegistry, NativeModules, Platform } from 'react-native';
import { name as appName } from './app.json';
import React, { useEffect, useState } from 'react';
import { LogBox } from 'react-native';
import LocalStorage from './src/local_storage';
import { startServices, configPushNotification } from 'omikit-plugin';
import { App } from './src/App';

LogBox.ignoreAllLogs();

// Architecture detection helper — must be called after runtime init (inside component)
function logArchitectureInfo() {
  const isFabric = global.nativeFabricUIManager != null;
  const isBridgeless = global.RN$Bridgeless === true;
  const isNewArch = isFabric || isBridgeless;
  const turboModule = TurboModuleRegistry.get('OmikitPlugin');
  const bridgeModule = NativeModules.OmikitPlugin;

  const pluginMode = (() => {
    if (!turboModule && !bridgeModule) return 'NOT FOUND ✗';
    if (isNewArch) return turboModule != null ? 'TurboModule — New Arch ✓' : 'NativeModules — New Arch (interop)';
    return 'NativeModules — Old Arch ✓';
  })();

  console.log('=== [ARCH] React Native Architecture ===');
  console.log('[ARCH] Platform       :', Platform.OS);
  console.log('[ARCH] New Arch       :', isNewArch ? 'YES' : 'NO');
  console.log('[ARCH] Fabric (UI)    :', isFabric ? 'YES' : 'NO');
  console.log('[ARCH] Bridgeless     :', isBridgeless ? 'YES' : 'NO');
  console.log('[ARCH] TurboModuleRegistry resolves OmikitPlugin:', turboModule != null ? 'YES' : 'NO');
  console.log('[ARCH] NativeModules  resolves OmikitPlugin:', bridgeModule != null ? 'YES' : 'NO');
  console.log('[ARCH] Plugin mode    :', pluginMode);
  console.log('========================================');
}

export const Main = () => {
  const [isLogin, setLogin] = useState(false);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    logArchitectureInfo();
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
