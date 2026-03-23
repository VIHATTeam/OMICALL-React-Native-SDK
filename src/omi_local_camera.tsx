import { NativeModules, Platform, View } from 'react-native';

// Safe requireNativeComponent — returns fallback View if native config not available
let OmiLocalCameraViewNative: any = View;
try {
  const { UIManager, requireNativeComponent } = require('react-native');
  if (Platform.OS === 'android' || UIManager.getViewManagerConfig?.('OmiLocalCameraView')) {
    OmiLocalCameraViewNative = requireNativeComponent('OmiLocalCameraView');
  }
} catch (_) {
  // Fallback to plain View — iOS Fabric uses native window rendering instead
}

export const OmiLocalCameraView = OmiLocalCameraViewNative;

// Imperative refresh method
const OmiLocalCamera = NativeModules.OmiLocalCameraView;
export function refreshLocalCamera(): Promise<boolean> {
  if (!OmiLocalCamera) return Promise.resolve(false);
  return OmiLocalCamera.refresh();
}
