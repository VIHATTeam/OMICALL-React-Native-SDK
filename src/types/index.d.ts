declare module 'omikit-plugin' {
  import type { NativeEventEmitter } from 'react-native';
  import type { ComponentType } from 'react';
  import type { ViewProps } from 'react-native';

  // ============================================
  // SERVICE & AUTHENTICATION
  // ============================================

  /**
   * Initialize SDK services. Call once on app launch (e.g., App.tsx or index.js).
   * Sets up native audio system and event listeners.
   * Do NOT call multiple times.
   */
  export function startServices(): Promise<boolean>;

  /**
   * Configure push notification settings.
   * Call after startServices(), before or after login.
   */
  export function configPushNotification(data: any): Promise<any>;

  /**
   * Get pending call data on cold start (app launched from push notification).
   * Returns call info if there's a pending incoming call, null otherwise.
   */
  export function getInitialCall(): Promise<any>;

  /**
   * Login with SIP username/password credentials.
   * @param data.userName - SIP username
   * @param data.password - SIP password
   * @param data.realm - SIP realm/domain
   * @param data.host - SIP proxy server (optional, defaults to vh.omicrm.com)
   * @param data.isVideo - Enable video capability (required true for video calls)
   * @param data.fcmToken - Firebase token for push notifications
   * @param data.projectId - OMICALL project ID (optional)
   * @param data.isSkipDevices - true = Customer mode, false = Agent mode (default)
   */
  export function initCallWithUserPassword(data: {
    userName: string;
    password: string;
    realm: string;
    host?: string;
    isVideo: boolean;
    fcmToken: string;
    projectId?: string;
    isSkipDevices?: boolean;
  }): Promise<boolean>;

  /**
   * Login with API key.
   * @param data.fullName - Display name
   * @param data.usrUuid - User UUID from OMICALL
   * @param data.apiKey - API key from OMICALL dashboard
   * @param data.isVideo - Enable video capability
   * @param data.phone - Phone number
   * @param data.fcmToken - Firebase token for push notifications
   * @param data.projectId - OMICALL project ID (optional)
   */
  export function initCallWithApiKey(data: {
    fullName: string;
    usrUuid: string;
    apiKey: string;
    isVideo: boolean;
    phone: string;
    fcmToken: string;
    projectId?: string;
  }): Promise<boolean>;

  /** Logout and unregister SIP */
  export function logout(): Promise<boolean>;

  // ============================================
  // CALL CONTROL
  // ============================================

  /**
   * Start an outgoing call.
   * @param data.phoneNumber - Number to call
   * @param data.isVideo - true for video call, false for audio
   * @returns { status: OmiStartCallStatus, message?: string, _id?: string }
   */
  export function startCall(data: {
    phoneNumber: string;
    isVideo: boolean;
  }): Promise<{
    status: OmiStartCallStatus | number | string;
    message?: string;
    _id?: string;
  }>;

  /** Start call by user UUID */
  export function startCallWithUuid(data: {
    usrUuid: string;
    isVideo: boolean;
  }): Promise<boolean>;

  /** Accept incoming call */
  export function joinCall(): Promise<any>;

  /** End active call (sends SIP BYE) */
  export function endCall(): Promise<any>;

  /** Reject call on this device only (sends 486 Busy) */
  export function rejectCall(): Promise<boolean>;

  /** Reject call and stop ringing on ALL devices (sends 603 Decline) */
  export function dropCall(): Promise<boolean>;

  /** Blind transfer active call to another number */
  export function transferCall(data: { phoneNumber: string }): Promise<boolean>;

  // ============================================
  // MEDIA CONTROL
  // ============================================

  /** Toggle microphone mute. Returns new mute state or null */
  export function toggleMute(): Promise<boolean | null>;

  /** Toggle speakerphone. Returns new speaker state */
  export function toggleSpeaker(): Promise<boolean>;

  /** Toggle call hold */
  export function toggleHold(): Promise<void>;

  /** Set hold state explicitly */
  export function onHold(data: { holdStatus: boolean }): Promise<boolean>;

  /** Send DTMF tone (0-9, *, #) */
  export function sendDTMF(data: { character: string }): Promise<boolean>;

  /** List available audio output devices */
  export function getAudio(): Promise<any>;

  /** Set audio output device */
  export function setAudio(data: { portType: OmiAudioType | number }): Promise<void>;

  /** Get current audio output device */
  export function getCurrentAudio(): Promise<any>;

  // ============================================
  // VIDEO CONTROL
  // ============================================

  /**
   * Toggle video stream on/off during a video call.
   * When off, remote party sees a black/frozen frame.
   */
  export function toggleOmiVideo(): Promise<boolean>;

  /** Switch between front and back camera */
  export function switchOmiCamera(): Promise<boolean>;

  /**
   * Register for video event notifications (iOS only).
   * Call before starting/receiving a video call.
   * Not needed on Android.
   */
  export function registerVideoEvent(): Promise<boolean>;

  /**
   * Unregister video event notifications (iOS only).
   * Call when leaving video call screen.
   */
  export function removeVideoEvent(): Promise<boolean>;

  /**
   * Connect remote video feed to native TextureView surface.
   * Call when call is confirmed (OmiCallState.confirmed).
   * On Android: connects SDK incoming video to TextureView.
   * On iOS Old Arch: triggers prepareForVideoDisplay.
   */
  export function refreshRemoteCamera(): Promise<boolean>;

  /**
   * Connect local camera feed to native TextureView surface.
   * Call when call is confirmed (OmiCallState.confirmed).
   * On Android: connects SDK local camera to TextureView (300ms delay for camera init).
   * On iOS Old Arch: triggers prepareForVideoDisplay.
   */
  export function refreshLocalCamera(): Promise<boolean>;

  /**
   * Create native video containers and add to UIWindow (iOS New Arch / Fabric only).
   * On Fabric, RCTViewManager.view() is not called, so containers must be created manually.
   * Call when call is confirmed, then use setCameraConfig() to adjust position/style.
   * On Android, this is a no-op.
   */
  export function setupVideoContainers(): Promise<boolean>;

  /**
   * Configure native video container style (iOS New Arch / Fabric only).
   * Controls position, size, appearance, and visibility of video containers on UIWindow.
   * On Android, use React style props on OmiRemoteCameraView/OmiLocalCameraView instead.
   *
   * @param config.target - Which camera: 'local' or 'remote'
   * @param config.x - X position on screen
   * @param config.y - Y position on screen
   * @param config.width - View width
   * @param config.height - View height
   * @param config.borderRadius - Corner radius
   * @param config.borderWidth - Border width
   * @param config.borderColor - Border color (hex: '#RRGGBB' or '#RRGGBBAA')
   * @param config.backgroundColor - Background color (hex)
   * @param config.opacity - View opacity (0.0 - 1.0)
   * @param config.hidden - Show/hide the video container
   * @param config.scaleMode - Video scaling: 'fill' (aspect fill), 'fit' (aspect fit), 'stretch'
   */
  export function setCameraConfig(config: {
    target: 'local' | 'remote';
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    borderRadius?: number;
    borderWidth?: number;
    borderColor?: string;
    backgroundColor?: string;
    opacity?: number;
    hidden?: boolean;
    scaleMode?: 'fill' | 'fit' | 'stretch';
  }): Promise<boolean>;

  // ============================================
  // VIDEO COMPONENTS
  // ============================================

  /**
   * Remote camera view — displays the other party's video.
   * Android: renders via native TextureView. Style with React props.
   * iOS Old Arch: renders via RCTViewManager. Style with React props.
   * iOS New Arch (Fabric): falls back to plain View (use setupVideoContainers instead).
   */
  export const OmiRemoteCameraView: ComponentType<ViewProps>;

  /**
   * Local camera view — displays your own camera preview (PiP).
   * Same platform behavior as OmiRemoteCameraView.
   */
  export const OmiLocalCameraView: ComponentType<ViewProps>;

  // ============================================
  // USER & INFO
  // ============================================

  /** Get logged-in user details (extension, name, etc.) */
  export function getCurrentUser(): Promise<any>;

  /** Get remote/guest user details during a call */
  export function getGuestUser(): Promise<any>;

  /** Look up user info by phone number */
  export function getUserInfo(phone: string): Promise<any>;

  // ============================================
  // GETTER FUNCTIONS (v4.0.1+)
  // ============================================

  /** Get the current Firebase project ID */
  export function getProjectId(): Promise<string | null>;

  /** Get the current app ID */
  export function getAppId(): Promise<string | null>;

  /** Get the current device ID */
  export function getDeviceId(): Promise<string | null>;

  /** Get the FCM push token */
  export function getFcmToken(): Promise<string | null>;

  /** Get SIP registration info (format: user@realm) */
  export function getSipInfo(): Promise<string | null>;

  /** Get VoIP push token (iOS only, returns null on Android) */
  export function getVoipToken(): Promise<string | null>;

  // ============================================
  // NOTIFICATION CONTROL
  // ============================================

  /** Hide system notification without unregistering SIP */
  export function hideSystemNotificationSafely(): Promise<boolean>;

  /** Hide notification only (no SIP changes) */
  export function hideSystemNotificationOnly(): Promise<boolean>;

  /** Hide notification and unregister SIP with reason */
  export function hideSystemNotificationAndUnregister(reason: string): Promise<boolean>;

  // ============================================
  // PERMISSIONS (Android)
  // ============================================

  /** Check current permission status. Returns detailed permission info */
  export function checkPermissionStatus(): Promise<any>;

  /**
   * Check and request all required permissions.
   * @param isVideo - true to also request camera permission
   */
  export function checkAndRequestPermissions(isVideo?: boolean): Promise<boolean>;

  /** Request SYSTEM_ALERT_WINDOW permission for overlay (Android) */
  export function requestSystemAlertWindowPermission(): Promise<boolean>;

  /** Check if app can draw overlays (Android M+) */
  export function systemAlertWindow(): Promise<boolean>;

  /** Open system alert window settings page */
  export function openSystemAlertSetting(): Promise<void>;

  /**
   * Request specific permissions by status codes.
   * @param codes - Array of permission codes (450=mic, 451=camera, 452=overlay)
   */
  export function requestPermissionsByCodes(codes: number[]): Promise<boolean>;

  // ============================================
  // ADVANCED FEATURES
  // ============================================

  /**
   * Validate SIP credentials without establishing a connection.
   * @returns { success, statusCode, message }
   */
  export function checkCredentials(data: {
    userName: string;
    password: string;
    realm: string;
  }): Promise<{
    success: boolean;
    statusCode?: number;
    message?: string;
  }>;

  /**
   * Register with full control over registration behavior.
   * @returns { success, statusCode, message }
   */
  export function registerWithOptions(data: any): Promise<{
    success: boolean;
    statusCode?: number;
    message?: string;
  }>;

  /** Check current keep-alive status */
  export function getKeepAliveStatus(): Promise<any>;

  /** Manually trigger a keep-alive ping */
  export function triggerKeepAlivePing(): Promise<boolean>;

  // ============================================
  // ENUMS
  // ============================================

  /** Call state enum for tracking call lifecycle */
  export enum OmiCallState {
    unknown = 0,
    calling = 1,
    incoming = 2,
    early = 3,
    connecting = 4,
    confirmed = 5,
    disconnected = 6,
    hold = 7,
    /** Call is being disconnected (BYE sent, waiting for response) */
    disconnecting = 12,
  }

  /**
   * Status codes returned by startCall().
   * Check these to handle different call initiation results.
   */
  export enum OmiStartCallStatus {
    invalidUuid = 0,
    invalidPhoneNumber = 1,
    samePhoneNumber = 2,
    maxRetry = 3,
    permissionDenied = 4,
    permissionMicrophone = 450,
    permissionCamera = 451,
    permissionOverlay = 452,
    couldNotFindEndpoint = 5,
    accountRegisterFailed = 6,
    startCallFailed = 7,
    startCallSuccess = 8,
    startCallSuccessIOS = 407,
    haveAnotherCall = 9,
    accountTurnOffNumberInternal = 10,
    noNetwork = 11,
  }

  /** Audio output types for setAudio() */
  export enum OmiAudioType {
    receiver = 0,
    speaker = 1,
    bluetooth = 2,
    headphones = 3,
  }

  // ============================================
  // EVENTS
  // ============================================

  /** Event name constants — use with omiEmitter.addListener() */
  export const OmiCallEvent: {
    /** Call lifecycle changes. Payload: { status, callerNumber, isVideo, incoming, codeEndCall } */
    onCallStateChanged: string;
    /** Speaker toggled. Payload: boolean */
    onSpeaker: string;
    /** Microphone mute toggled. Payload: boolean */
    onMuted: string;
    /** Hold state changed. Payload: boolean */
    onHold: string;
    /** Remote video stream ready. Call refreshRemoteCamera() */
    onRemoteVideoReady: string;
    /** User tapped missed call notification. Payload: { callerNumber } */
    onClickMissedCall: string;
    /** Switchboard answered. Payload: { data } */
    onSwitchboardAnswer: string;
    /** Call quality metrics. Payload: { quality: 0|1|2, stat: { mos, jitter, latency, packetLoss } } */
    onCallQuality: string;
    /** Audio device changed. Payload: { data } */
    onAudioChange: string;
    /** Permission request needed (Android). Payload: { permissions } */
    onRequestPermissionAndroid: string;
  };

  /**
   * Event emitter for listening to SDK events.
   * iOS: NativeEventEmitter (receives from RCTEventEmitter).
   * Android: DeviceEventEmitter.
   *
   * Usage:
   * ```typescript
   * const sub = omiEmitter.addListener(OmiCallEvent.onCallStateChanged, (data) => {
   *   console.log('Status:', data.status);
   * });
   * // Cleanup:
   * sub.remove();
   * ```
   *
   * Important: use subscription.remove() — NOT removeAllListeners()
   * (removeAllListeners removes listeners from ALL screens).
   */
  export const omiEmitter: NativeEventEmitter;
}
