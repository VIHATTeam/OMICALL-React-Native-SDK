import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  // Registration & Authentication (2 methods)
  initCallWithUserPassword(data: {
    userName: string;
    password: string;
    realm: string;
    host?: string;
    isVideo: boolean;
    fcmToken: string;
    projectId?: string;
  }): Promise<boolean>;

  initCallWithApiKey(data: {
    fullName: string;
    usrUuid: string;
    apiKey: string;
    isVideo: boolean;
    phone: string;
    fcmToken: string;
    projectId?: string;
  }): Promise<boolean>;

  // Call Control (10 methods)
  startServices(): Promise<boolean>;

  startCall(data: {
    phoneNumber: string;
    isVideo: boolean;
  }): Promise<{
    status: number;
    message: string;
    _id: string;
  }>;

  startCallWithUuid(data: {
    usrUuid: string;
    isVideo: boolean;
  }): Promise<boolean>;

  joinCall(): Promise<boolean>;
  endCall(): Promise<boolean>;
  rejectCall(): Promise<boolean>;
  dropCall(): Promise<boolean>;

  transferCall(data: {
    phoneNumber: string;
  }): Promise<boolean>;

  getInitialCall(data: {
    counter: number;
  }): Promise<any>;

  // Media Control (11 methods)
  toggleMute(): Promise<boolean | null>;
  toggleHold(): Promise<void>;

  onHold(data: {
    holdStatus: boolean;
  }): Promise<boolean>;

  toggleSpeaker(): Promise<boolean>;
  toggleOmiVideo(): Promise<boolean>;
  switchOmiCamera(): Promise<boolean>;
  registerVideoEvent(): Promise<boolean>;
  removeVideoEvent(): Promise<boolean>;

  sendDTMF(data: {
    character: string;
  }): Promise<boolean>;

  getAudio(): Promise<any>;
  getCurrentAudio(): Promise<any>;

  setAudio(data: {
    portType: number;
  }): Promise<void>;

  // User & Info (3 methods)
  getCurrentUser(): Promise<Object | null>;
  getGuestUser(): Promise<Object | null>;

  getUserInfo(data: {
    phone: string;
  }): Promise<any>;

  // Notifications (4 methods)
  configPushNotification(data: Object): Promise<any>;
  hideSystemNotificationSafely(): Promise<boolean>;
  hideSystemNotificationOnly(): Promise<boolean>;

  hideSystemNotificationAndUnregister(data: {
    reason: string;
  }): Promise<boolean>;

  // Permissions (6 methods)
  checkAndRequestPermissions(data: {
    isVideo: boolean;
  }): Promise<boolean>;

  checkPermissionStatus(): Promise<any>;

  requestPermissionsByCodes(data: {
    codes: number[];
  }): Promise<boolean>;

  systemAlertWindow(): Promise<boolean>;
  requestSystemAlertWindowPermission(): Promise<boolean>;
  openSystemAlertSetting(): Promise<void>;

  // Advanced Features (4 methods)
  checkCredentials(data: Object): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
  }>;

  registerWithOptions(data: Object): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
  }>;

  getKeepAliveStatus(): Promise<any>;
  triggerKeepAlivePing(): Promise<boolean>;

  // Logout
  logout(): Promise<boolean>;

  // Constants
  getConstants(): {
    CALL_STATE_CHANGED: string;
    MUTED: string;
    HOLD: string;
    SPEAKER: string;
    REMOTE_VIDEO_READY: string;
    CLICK_MISSED_CALL: string;
    SWITCHBOARD_ANSWER: string;
    CALL_QUALITY: string;
    AUDIO_CHANGE: string;
    REQUEST_PERMISSION: string;
  };
}

export default TurboModuleRegistry.get<Spec>('OmikitPlugin') as Spec | null;
