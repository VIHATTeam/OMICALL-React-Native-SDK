import type { HostComponent } from 'react-native';
import { NativeModules, requireNativeComponent, ViewProps } from 'react-native';

// Camera Views always use Paper (requireNativeComponent) because:
// - iOS native code doesn't have Fabric ComponentView implementation yet
// - Paper components work fine even when New Architecture is enabled
// - This avoids undefined symbol errors (_FLRemoteCameraViewCls)
const OmiRemoteCameraViewPaper: HostComponent<ViewProps> = requireNativeComponent(
  'FLRemoteCameraView'
);

// Export the Paper component
export const OmiRemoteCameraView: HostComponent<ViewProps> = OmiRemoteCameraViewPaper;

// Module name separated from ViewManager name to avoid name collision
const FLRemoteCamera = NativeModules.FLRemoteCameraModule || NativeModules.FLRemoteCameraView;
export function refreshRemoteCamera(): Promise<boolean> {
  if (!FLRemoteCamera) return Promise.resolve(false);
  return FLRemoteCamera.refresh();
}
