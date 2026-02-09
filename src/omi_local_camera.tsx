import type { HostComponent } from 'react-native';
import { NativeModules, requireNativeComponent, ViewProps } from 'react-native';

// Camera Views always use Paper (requireNativeComponent) because:
// - iOS native code doesn't have Fabric ComponentView implementation yet
// - Paper components work fine even when New Architecture is enabled
// - This avoids undefined symbol errors (_FLLocalCameraViewCls)
const OmiLocalCameraViewPaper: HostComponent<ViewProps> = requireNativeComponent(
  'FLLocalCameraView'
);

// Export the Paper component
export const OmiLocalCameraView: HostComponent<ViewProps> = OmiLocalCameraViewPaper;

// Methods remain unchanged
const FLLocalCamera = NativeModules.FLLocalCameraView;
export function refreshLocalCamera(): Promise<boolean> {
  return FLLocalCamera.refresh();
}
