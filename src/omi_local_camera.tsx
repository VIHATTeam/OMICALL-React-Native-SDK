import type { HostComponent } from 'react-native';
import { NativeModules, requireNativeComponent, ViewProps } from 'react-native';

const FLLocalCamera = NativeModules.FLLocalCameraView;

export const OmiLocalCameraView: HostComponent<ViewProps> =
  requireNativeComponent('FLLocalCameraView');

export function refreshLocalCamera(): Promise<boolean> {
  return FLLocalCamera.refresh();
}
