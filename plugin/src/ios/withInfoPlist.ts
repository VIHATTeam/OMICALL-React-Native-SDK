import { ConfigPlugin, withInfoPlist } from '@expo/config-plugins';

import { OmikitOnPremiseProps, OmikitPluginProps } from '../types';

const BACKGROUND_MODES = ['voip', 'remote-notification', 'fetch'];

/**
 * Info.plist keys the native Expo lifecycle subscriber reads at launch to
 * configure OmiKit. Namespaced under "OMIKit" to avoid collisions.
 */
export interface OmikitInfoPlistConfig {
  OMIKitEnvironment: 'sandbox' | 'production';
  OMIKitUserNameKey: string;
  OMIKitMaxCall: number;
  OMIKitCallKitImage: string;
  OMIKitTypePushVoip: 'default' | 'callkit';
  OMIKitEnableVideo: boolean;
  OMIKitOnPremise?: OmikitOnPremiseProps;
}

/** Build the on-premise dict, stripping empty values (keep-SDK-default). */
function buildOnPremise(
  onPremise?: OmikitOnPremiseProps
): Record<string, string> | undefined {
  if (!onPremise) return undefined;
  const entries = Object.entries(onPremise).filter(
    ([, v]) => typeof v === 'string' && v.length > 0
  ) as [string, string][];
  if (entries.length === 0) return undefined;
  return Object.fromEntries(entries);
}

export const withOmikitInfoPlist: ConfigPlugin<
  OmikitPluginProps & {
    environment: 'sandbox' | 'production';
    enableVideo: boolean;
    userNameKey: string;
    maxCall: number;
    callKitImage: string;
    typePushVoip: 'default' | 'callkit';
    microphonePermission: string;
    cameraPermission: string;
  }
> = (config, props) => {
  return withInfoPlist(config, (cfg) => {
    const plist = cfg.modResults;

    // --- Permission usage descriptions ---
    plist.NSMicrophoneUsageDescription =
      plist.NSMicrophoneUsageDescription || props.microphonePermission;
    if (props.enableVideo) {
      plist.NSCameraUsageDescription =
        plist.NSCameraUsageDescription || props.cameraPermission;
    }

    // --- Background modes (merge-dedupe) ---
    const existing: string[] = Array.isArray(plist.UIBackgroundModes)
      ? (plist.UIBackgroundModes as string[])
      : [];
    plist.UIBackgroundModes = Array.from(
      new Set([...existing, ...BACKGROUND_MODES])
    );

    // --- SDK config the native subscriber reads at launch ---
    plist.OMIKitEnvironment = props.environment;
    plist.OMIKitUserNameKey = props.userNameKey;
    plist.OMIKitMaxCall = props.maxCall;
    plist.OMIKitCallKitImage = props.callKitImage;
    plist.OMIKitTypePushVoip = props.typePushVoip;
    plist.OMIKitEnableVideo = props.enableVideo;

    const onPremise = buildOnPremise(props.onPremise);
    if (onPremise) {
      plist.OMIKitOnPremise = onPremise;
    } else {
      delete plist.OMIKitOnPremise;
    }

    return cfg;
  });
};
