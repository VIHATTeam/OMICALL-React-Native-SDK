declare module 'omikit-plugin' {
  import { NativeEventEmitter } from 'react-native';

  // ============================================
  // FUNCTIONS
  // ============================================

  export function startServices(): Promise<any>;
  export function configPushNotification(data: any): Promise<any>;
  export function getInitialCall(): Promise<any>;
  export function initCallWithUserPassword(data: any): Promise<boolean>;
  export function initCallWithApiKey(data: any): Promise<boolean>;

  /**
   * Starts a new call
   * @param data - Call configuration { phoneNumber: string, isVideo: boolean }
   * @returns Promise with call result { status: OmiStartCallStatus, message?: string, _id?: string }
   */
  export function startCall(data: {
    phoneNumber: string;
    isVideo: boolean;
  }): Promise<{
    status: OmiStartCallStatus | number | string;
    message?: string;
    _id?: string;
  }>;

  export function startCallWithUuid(data: any): Promise<boolean>;
  export function joinCall(): Promise<any>;
  export function endCall(): Promise<any>;
  export function toggleMute(): Promise<boolean>;
  export function toggleHold(): Promise<boolean>;
  export function toggleSpeaker(): Promise<boolean>;
  export function onHold(data: any): Promise<boolean>;
  export function sendDTMF(data: any): Promise<boolean>;
  export function switchOmiCamera(): Promise<boolean>;
  export function toggleOmiVideo(): Promise<boolean>;
  export function logout(): Promise<boolean>;
  export function registerVideoEvent(): Promise<boolean>;
  export function removeVideoEvent(): Promise<boolean>;
  export function getCurrentUser(): Promise<any>;
  export function getGuestUser(): Promise<any>;
  export function systemAlertWindow(): Promise<boolean>;
  export function openSystemAlertSetting(): Promise<void>;
  export function getAudio(): Promise<any>;
  export function setAudio(data: { portType: OmiAudioType | number }): Promise<void>;
  export function getCurrentAudio(): Promise<any>;
  export function transferCall(data: any): Promise<boolean>;
  export function rejectCall(): Promise<boolean>;
  export function dropCall(): Promise<boolean>;
  export function getKeepAliveStatus(): Promise<any>;
  export function triggerKeepAlivePing(): Promise<boolean>;
  export function checkPermissionStatus(): Promise<any>;
  export function checkAndRequestPermissions(isVideo?: boolean): Promise<boolean>;
  export function requestSystemAlertWindowPermission(): Promise<boolean>;
  export function requestPermissionsByCodes(codes: number[]): Promise<boolean>;
  export function hideSystemNotificationSafely(): Promise<boolean>;
  export function hideSystemNotificationOnly(): Promise<boolean>;
  export function hideSystemNotificationAndUnregister(reason: string): Promise<boolean>;
  export function checkCredentials(data: any): Promise<{
    success: boolean;
    statusCode?: number;
    message?: string;
  }>;
  export function registerWithOptions(data: any): Promise<{
    success: boolean;
    statusCode?: number;
    message?: string;
  }>;

  // ============================================
  // ENUMS
  // ============================================

  /**
   * Call state enum for tracking call lifecycle
   */
  export enum OmiCallState {
    unknown = 0,
    calling = 1,
    incoming = 2,
    early = 3,
    connecting = 4,
    confirmed = 5,
    disconnected = 6,
    hold = 7,
  }

  /**
   * Status codes returned by startCall() function
   * Use these to handle different call initiation results
   */
  export enum OmiStartCallStatus {
    // Validation errors (0-3)
    invalidUuid = 0,
    invalidPhoneNumber = 1,
    samePhoneNumber = 2,
    maxRetry = 3,

    // Permission errors (4, 450-452)
    permissionDenied = 4,
    permissionMicrophone = 450,
    permissionCamera = 451,
    permissionOverlay = 452,

    // Call errors (5-7)
    couldNotFindEndpoint = 5,
    accountRegisterFailed = 6,
    startCallFailed = 7,

    // Success statuses (8, 407)
    startCallSuccess = 8,
    startCallSuccessIOS = 407,

    // Other errors (9+)
    haveAnotherCall = 9,
  }

  /**
   * Audio output types for setAudio()
   */
  export enum OmiAudioType {
    receiver = 0,
    speaker = 1,
    bluetooth = 2,
    headphones = 3,
  }

  // ============================================
  // CONSTANTS & EVENTS
  // ============================================

  export const OmiCallEvent: {
    onCallStateChanged: string;
    onSpeaker: string;
    onMuted: string;
    onHold: string;
    onRemoteVideoReady: string;
    onClickMissedCall: string;
    onSwitchboardAnswer: string;
    onCallQuality: string;
    onAudioChange: string;
    onRequestPermissionAndroid: string;
  };

  export const omiEmitter: NativeEventEmitter;
}
