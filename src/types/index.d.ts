declare module 'omikit-plugin' {
  import { NativeEventEmitter } from 'react-native';

  export function startServices(): Promise<any>;
  export function configPushNotification(data: any): Promise<any>;
  export function getInitialCall(): Promise<any>;
  export function initCallWithUserPassword(data: any): Promise<boolean>;
  export function initCallWithApiKey(data: any): Promise<boolean>;
  export function startCall(data: any): Promise<boolean>;
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
  export function setAudio(data: any): Promise<void>;
  export function getCurrentAudio(): Promise<any>;
  export function transferCall(data: any): Promise<boolean>;
  export function rejectCall(): Promise<boolean>;
  export function testEventEmission(): Promise<boolean>;
  export function getKeepAliveStatus(): Promise<any>;
  export function triggerKeepAlivePing(): Promise<boolean>;

  export enum OmiCallState {
    unknown,
    calling,
    incoming,
    early,
    connecting,
    confirmed,
    disconnected,
    hold,
  }

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
