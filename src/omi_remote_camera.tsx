import { NativeModules, Platform, View } from 'react-native';

// Safe requireNativeComponent — returns fallback View if native config not available
let OmiRemoteCameraViewNative: any = View;
try {
  const { UIManager, requireNativeComponent } = require('react-native');
  // Only attempt on Android or Old Arch iOS where ViewManager config exists
  if (Platform.OS === 'android' || UIManager.getViewManagerConfig?.('OmiRemoteCameraView')) {
    OmiRemoteCameraViewNative = requireNativeComponent('OmiRemoteCameraView');
  }
} catch (_) {
  // Fallback to plain View — iOS Fabric uses native window rendering instead
}

export const OmiRemoteCameraView = OmiRemoteCameraViewNative;

// Imperative refresh method
const OmiRemoteCamera = NativeModules.OmiRemoteCameraView;
export function refreshRemoteCamera(): Promise<boolean> {
  if (!OmiRemoteCamera) return Promise.resolve(false);
  return OmiRemoteCamera.refresh();
}
