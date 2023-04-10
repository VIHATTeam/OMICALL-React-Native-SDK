import type { HostComponent } from 'react-native';
import { NativeModules, requireNativeComponent, ViewProps } from 'react-native';

const FLRemoteCamera = NativeModules.FLRemoteCameraView;

export const OmiRemoteCameraView: HostComponent<ViewProps> =
  requireNativeComponent('FLRemoteCameraView');

export function refreshRemoteCamera(): Promise<boolean> {
  return FLRemoteCamera.refresh();
}
