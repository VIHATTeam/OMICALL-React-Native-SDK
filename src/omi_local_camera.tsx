import type { HostComponent } from 'react-native';
import { NativeModules, requireNativeComponent, ViewProps } from 'react-native';

// Safe lazy loading — requireNativeComponent can throw in bridgeless mode
// if the native view is not registered for Fabric
let _localCameraView: HostComponent<ViewProps> | null = null;
const getLocalCameraView = (): HostComponent<ViewProps> => {
  if (!_localCameraView) {
    _localCameraView = requireNativeComponent('FLLocalCameraView');
  }
  return _localCameraView;
};

export const OmiLocalCameraView = new Proxy({} as HostComponent<ViewProps>, {
  get(_target, prop) {
    return (getLocalCameraView() as any)[prop];
  },
});

// Module name separated from ViewManager name to avoid name collision
const FLLocalCamera = NativeModules.FLLocalCameraModule || NativeModules.FLLocalCameraView;
export function refreshLocalCamera(): Promise<boolean> {
  if (!FLLocalCamera) return Promise.resolve(false);
  return FLLocalCamera.refresh();
}
