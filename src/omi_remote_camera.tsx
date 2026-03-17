import type { HostComponent } from 'react-native';
import { NativeModules, requireNativeComponent, ViewProps } from 'react-native';

// Safe lazy loading — requireNativeComponent can throw in bridgeless mode
// if the native view is not registered for Fabric
let _remoteCameraView: HostComponent<ViewProps> | null = null;
const getRemoteCameraView = (): HostComponent<ViewProps> => {
  if (!_remoteCameraView) {
    _remoteCameraView = requireNativeComponent('FLRemoteCameraView');
  }
  return _remoteCameraView;
};

export const OmiRemoteCameraView = new Proxy({} as HostComponent<ViewProps>, {
  get(_target, prop) {
    return (getRemoteCameraView() as any)[prop];
  },
});

// Module name separated from ViewManager name to avoid name collision
const FLRemoteCamera = NativeModules.FLRemoteCameraModule || NativeModules.FLRemoteCameraView;
export function refreshRemoteCamera(): Promise<boolean> {
  if (!FLRemoteCamera) return Promise.resolve(false);
  return FLRemoteCamera.refresh();
}
