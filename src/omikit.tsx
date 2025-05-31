import { NativeModules, Platform, NativeEventEmitter, DeviceEventEmitter } from 'react-native';

const LINKING_ERROR =
  `The package 'omikit-plugin' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

// ✅ Khai báo chính xác Native Module
const OmikitPlugin = NativeModules.OmikitPlugin
  ? NativeModules.OmikitPlugin
  : new Proxy(
    {},
    {
      get() {
        throw new Error(LINKING_ERROR);
      },
    }
  );

// ✅ Setup omiEmitter cho iOS và Android
const omiEmitter = Platform.OS === 'ios'
  ? new NativeEventEmitter(OmikitPlugin)
  : DeviceEventEmitter;

/**
 * Starts the Omikit services.
 * @returns {Promise<any>} A promise that resolves when the services start successfully.
 */
export function startServices(): Promise<any> {
  return OmikitPlugin.startServices();
}

/**
 * Configures push notifications with the given data.
 * @param {any} data - Configuration data for push notifications.
 * @returns {Promise<any>} A promise that resolves when the configuration is complete.
 */
export function configPushNotification(data: any): Promise<any> {
  return OmikitPlugin.configPushNotification(data);
}

/**
 * Retrieves the initial call details when start call 
 * @returns {Promise<any>} A promise containing the initial call details.
 */
export function getInitialCall(): Promise<any> {
  if (Platform.OS == "ios") {
    return OmikitPlugin.getInitialCall();
  } else {
    return OmikitPlugin.getInitialCall(4);
  }
}

/**
 * Login into OMICALL with a username and password.
 * @param {any} data - User credentials for initialization.
 * @returns {Promise<boolean>} A promise that resolves to `true` if initialization is successful.
 */
export function initCallWithUserPassword(data: any): Promise<boolean> {
  return OmikitPlugin.initCallWithUserPassword(data);
}

/**
 * Login into OMICALL with using an API key.
 * @param {any} data - API key and related data.
 * @returns {Promise<boolean>} A promise that resolves to `true` if initialization is successful.
 */
export function initCallWithApiKey(data: any): Promise<boolean> {
  return OmikitPlugin.initCallWithApiKey(data);
}

/**
 * Starts a new call with the given data.
 * @param {any} data - Call configuration data.
 * @returns {Promise<boolean>} A promise that resolves to `true` if the call starts successfully.
 */
export function startCall(data: any): Promise<boolean> {
  return OmikitPlugin.startCall(data);
}

/**
 * Starts a call using a unique identifier (UUID).
 * @param {any} data - Call data including the UUID.
 * @returns {Promise<boolean>} A promise that resolves to `true` if the call starts successfully.
 */
export function startCallWithUuid(data: any): Promise<boolean> {
  return OmikitPlugin.startCallWithUuid(data);
}

/**
 * Joins an ongoing call.
 * @returns {Promise<any>} A promise that resolves when the user successfully joins the call.
 */
export function joinCall(): Promise<any> {
  return OmikitPlugin.joinCall();
}

/**
 * Ends the current call.
 * @returns {Promise<any>} A promise that resolves when the call ends successfully.
 */
export function endCall(): Promise<any> {
  return OmikitPlugin.endCall();
}

/**
 * Toggles the mute status of the microphone.
 * @returns {Promise<boolean>} A promise that resolves to `true` if the microphone is muted, `false` otherwise.
 */
export function toggleMute(): Promise<boolean> {
  return OmikitPlugin.toggleMute();
}

/**
 * Toggles the speaker status.
 * @returns {Promise<boolean>} A promise that resolves to `true` if the speaker is enabled, `false` otherwise.
 */
export function toggleSpeaker(): Promise<boolean> {
  return OmikitPlugin.toggleSpeaker();
}

/**
 * Toggles the hold call.
 * @returns {Promise<boolean>} A promise that resolves to `true` if when hold call success, `false` otherwise.
 */
export function toggleHold(): Promise<boolean> {
  return OmikitPlugin.toggleHold();
}

/**
 * Places the call on hold or resumes it.
 * @param {any} data - Data related to the hold action.
 * @returns {Promise<boolean>} A promise that resolves to `true` if the action succeeds.
 */
export function onHold(data: any): Promise<boolean> {
  return OmikitPlugin.onHold(data);
}

/**
 * Sends DTMF tones during a call.
 * @param {any} data - DTMF tones to be sent.
 * @returns {Promise<boolean>} A promise that resolves to `true` if the tones are sent successfully.
 */
export function sendDTMF(data: any): Promise<boolean> {
  return OmikitPlugin.sendDTMF(data);
}

/**
 * Switches the camera during a video call.
 * @returns {Promise<boolean>} A promise that resolves to `true` if the camera switches successfully.
 */
export function switchOmiCamera(): Promise<boolean> {
  return OmikitPlugin.switchOmiCamera();
}

/**
 * Toggles the video stream on or off during a video call.
 * @returns {Promise<boolean>} A promise that resolves to `true` if the video is toggled successfully.
 */
export function toggleOmiVideo(): Promise<boolean> {
  return OmikitPlugin.toggleOmiVideo();
}

/**
 * Logs the user out of the Omikit services.
 * @returns {Promise<boolean>} A promise that resolves to `true` if logout is successful.
 */
export function logout(): Promise<boolean> {
  return OmikitPlugin.logout();
}

/**
 * Registers for video call events.
 * @returns {Promise<boolean>} A promise that resolves to `true` if registration is successful.
 */
export function registerVideoEvent(): Promise<boolean> {
  return OmikitPlugin.registerVideoEvent();
}

/**
 * Removes video call event listeners.
 * @returns {Promise<boolean>} A promise that resolves to `true` if the removal is successful.
 */
export function removeVideoEvent(): Promise<boolean> {
  return OmikitPlugin.removeVideoEvent();
}

/**
 * Retrieves the current user's details.
 * @returns {Promise<any>} A promise containing the current user's details.
 */
export function getCurrentUser(): Promise<any> {
  return OmikitPlugin.getCurrentUser();
}

/**
 * Retrieves guest user details.
 * @returns {Promise<any>} A promise containing the guest user's details.
 */
export function getGuestUser(): Promise<any> {
  return OmikitPlugin.getGuestUser();
}

/**
 * Requests system alert window permissions.
 * @returns {Promise<boolean>} A promise that resolves to `true` if the permissions are granted.
 */
export function systemAlertWindow(): Promise<boolean> {
  return OmikitPlugin.systemAlertWindow();
}

/**
 * Opens the system alert settings page.
 * @returns {Promise<void>} A promise that resolves when the settings page is opened.
 */
export function openSystemAlertSetting(): Promise<void> {
  return OmikitPlugin.openSystemAlertSetting();
}

/**
 * Retrieves available audio devices.
 * @returns {Promise<any>} A promise containing the list of audio devices.
 */
export function getAudio(): Promise<any> {
  return OmikitPlugin.getAudio();
}

/**
 * Sets the audio device to be used during a call.
 * @param {any} data - Data related to the audio device.
 * @returns {Promise<void>} A promise that resolves when the audio device is set.
 */
export function setAudio(data: any): Promise<void> {
  return OmikitPlugin.setAudio(data);
}

/**
 * Retrieves the currently active audio device.
 * @returns {Promise<any>} A promise containing the current audio device details.
 */
export function getCurrentAudio(): Promise<any> {
  return OmikitPlugin.getCurrentAudio();
}

/**
 * Transfers the call to another user or device.
 * @param {any} data - Data related to the call transfer.
 * @returns {Promise<boolean>} A promise that resolves to `true` if the transfer is successful.
 */
export function transferCall(data: any): Promise<boolean> {
  return OmikitPlugin.transferCall(data);
}

/**
 * Rejects an incoming call.
 * This function is used to decline an active or incoming call.
 * 
 * @returns {Promise<boolean>} A promise that resolves to `true` if the call was successfully rejected, or `false` if an error occurred.
 */
export function rejectCall(): Promise<boolean> {
  return OmikitPlugin.rejectCall()
}

export function hideSystemNotificationSafely(): Promise<boolean> {
  return OmikitPlugin.hideSystemNotificationSafely();
}

export function hideSystemNotificationOnly(): Promise<boolean> {
  return OmikitPlugin.hideSystemNotificationOnly();
}

export function hideSystemNotificationAndUnregister(reason: string): Promise<boolean> {
  return OmikitPlugin.hideSystemNotificationAndUnregister(reason);
}

export const OmiCallEvent = {
  onCallStateChanged: 'CALL_STATE_CHANGED',
  onSpeaker: 'SPEAKER',
  onMuted: 'MUTED',
  onHold: 'HOLD',
  onRemoteVideoReady: 'REMOTE_VIDEO_READY',
  onClickMissedCall: 'CLICK_MISSED_CALL',
  onSwitchboardAnswer: 'SWITCHBOARD_ANSWER',
  onCallQuality: 'CALL_QUALITY',
  onAudioChange: 'AUDIO_CHANGE',
  onRequestPermissionAndroid: 'REQUEST_PERMISSION'
};

export { omiEmitter };

/**
 * Check credentials without maintaining connection (OmiSDK 2.3.67+)
 * @param {any} data - Credential data for validation
 * @returns {Promise<{success: boolean, statusCode?: number, message?: string}>} Validation result
 */
export function checkCredentials(data: any): Promise<{ success: boolean, statusCode?: number, message?: string }> {
  return OmikitPlugin.checkCredentials(data);
}

/**
 * Register with full control over notification and auto-unregister (OmiSDK 2.3.67+)
 * @param {any} data - Registration data with options
 * @returns {Promise<{success: boolean, statusCode?: number, message?: string}>} Registration result
 */
export function registerWithOptions(data: any): Promise<{ success: boolean, statusCode?: number, message?: string }> {
  return OmikitPlugin.registerWithOptions(data);
}

