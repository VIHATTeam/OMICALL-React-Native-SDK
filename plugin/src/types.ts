/**
 * On-premise endpoint overrides. Every field is optional — set only the hosts
 * the customer self-hosts; omitted fields keep the SDK default (OMI cloud).
 * These are written into the native config so the SDK applies them BEFORE its
 * first HTTP/SIP request at launch (via the Expo lifecycle subscriber).
 */
export interface OmikitOnPremiseProps {
  mobileSdkHost?: string;
  callEventHost?: string;
  publicApiHost?: string;
  pushInfoHost?: string;
  app2AppHost?: string;
  logUploadHost?: string;
  /** "host:port" */
  sipProxy?: string;
  /** "host:port" */
  stunServer?: string;
  /** "host:port" */
  turnServer?: string;
  turnUsername?: string;
  turnPassword?: string;
}

/**
 * Options passed to the omikit-plugin Expo config plugin via app.json:
 *
 *   "plugins": [["omikit-plugin", { "environment": "production", ... }]]
 *
 * Defaults match the SDK's documented React Native CLI setup so a plugin
 * entry with no props behaves like the canonical integration.
 */
export interface OmikitPluginProps {
  /** SDK environment. Default: 'production'. */
  environment?: 'sandbox' | 'production';
  /**
   * Enable video-call support. Default: false.
   * Gates: CAMERA permission, NSCameraUsageDescription,
   * FOREGROUND_SERVICE_CAMERA, and iOS Fabric legacy view interop.
   * Audio-only apps should leave this false to avoid requesting camera access.
   */
  enableVideo?: boolean;
  /** OmiKit userNameKey. Default: 'full_name'. */
  userNameKey?: string;
  /** Max concurrent calls. Default: 1. */
  maxCall?: number;
  /** iOS CallKit image asset name. Default: 'call_image'. */
  callKitImage?: string;
  /** VoIP push type. Default: 'default'. */
  typePushVoip?: 'default' | 'callkit';
  /** iOS NSMicrophoneUsageDescription message. */
  microphonePermission?: string;
  /** iOS NSCameraUsageDescription message (only used when enableVideo). */
  cameraPermission?: string;
  /** iOS aps-environment entitlement. Default: 'development'. */
  apsEnvironment?: 'development' | 'production';
  /** On-premise endpoint overrides (optional — only for self-hosted deployments). */
  onPremise?: OmikitOnPremiseProps;
}

/** Defaults applied when a prop is omitted. */
export const DEFAULT_PROPS: Required<
  Pick<
    OmikitPluginProps,
    | 'environment'
    | 'enableVideo'
    | 'userNameKey'
    | 'maxCall'
    | 'callKitImage'
    | 'typePushVoip'
    | 'microphonePermission'
    | 'cameraPermission'
    | 'apsEnvironment'
  >
> = {
  environment: 'production',
  enableVideo: false,
  userNameKey: 'full_name',
  maxCall: 1,
  callKitImage: 'call_image',
  typePushVoip: 'default',
  microphonePermission: 'This app needs microphone access for voice calls.',
  cameraPermission: 'This app needs camera access for video calls.',
  apsEnvironment: 'development',
};

/** Merge user props over defaults. */
export function withDefaults(props: OmikitPluginProps = {}): OmikitPluginProps &
  typeof DEFAULT_PROPS {
  return { ...DEFAULT_PROPS, ...props };
}
