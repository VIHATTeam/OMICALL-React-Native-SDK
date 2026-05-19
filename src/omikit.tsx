import { NativeModules, Platform, DeviceEventEmitter, TurboModuleRegistry } from 'react-native';
import type { Spec } from './NativeOmikitPlugin';

const LINKING_ERROR =
  `The package 'omikit-plugin' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

// Resolve native module: TurboModule (New Arch) → NativeModules (Old Arch) → null
const resolvedModule: Spec | null = (() => {
  try {
    // Try TurboModule first (New Architecture / bridgeless mode)
    const turboModule = TurboModuleRegistry.get<Spec>('OmikitPlugin');
    if (turboModule) return turboModule;
  } catch (_) {}

  // Fallback to NativeModules (Old Architecture / bridge mode)
  if (NativeModules.OmikitPlugin) {
    return NativeModules.OmikitPlugin;
  }

  return null;
})();

// Wrap in Proxy that throws LINKING_ERROR only when SDK methods are actually called
const OmikitPlugin: Spec = resolvedModule || new Proxy(
  {} as Spec,
  {
    get(_target, prop) {
      if (prop === 'addListener' || prop === 'removeListeners') {
        return () => {};
      }
      throw new Error(LINKING_ERROR);
    },
  }
);

// Setup omiEmitter — works across Old Arch, New Arch (Fabric), and bridgeless.
//
// Why DeviceEventEmitter on BOTH platforms (instead of NativeEventEmitter on iOS)?
//
// `new NativeEventEmitter(module)` was designed for the legacy bridge where
// the JS-side emitter explicitly calls `module.addListener(eventName)` and
// `module.removeListeners(count)` to track listener count on the same Obj-C
// instance that calls `sendEvent`. In NewArch + Fabric, the JS side resolves
// the module through the codegen TurboModule wrapper, but listener tracking
// often does NOT round-trip back to the underlying `RCTEventEmitter`
// instance, so `sendEvent` short-circuits with "no listeners registered" and
// drops the event.
//
// `DeviceEventEmitter` is the global JS-side counterpart of the native
// `RCTDeviceEventEmitter` JS module. The native side reaches it via either:
//   - `super.sendEvent(...)` (RCTEventEmitter routes through this module
//     internally — works once RN has wired the dispatch path), OR
//   - `bridge.enqueueJSCall("RCTDeviceEventEmitter", "emit", ...)`, OR
//   - `callableJSModules.invokeModule("RCTDeviceEventEmitter", "emit", ...)`.
//
// All three eventually feed `DeviceEventEmitter` on the JS side, so
// subscribing here always sees the event regardless of architecture.
// This matches what the Android side has been doing successfully all along.
const omiEmitter = DeviceEventEmitter;

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
    return OmikitPlugin.getInitialCall({ counter: 0 });
  } else {
    return OmikitPlugin.getInitialCall({ counter: 4 });
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
 * @returns {Promise<any>} A promise that resolves with call details if successful.
 */
export function startCall(data: any): Promise<any> {
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
 * @returns {Promise<boolean | null>} A promise that resolves to `true` if the microphone is muted, `false` otherwise, or `null` if unavailable.
 */
export function toggleMute(): Promise<boolean | null> {
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
 * @returns {Promise<void>} A promise that resolves when hold call is toggled.
 */
export function toggleHold(): Promise<void> {
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
 * Configure camera view style on iOS (Fabric mode — native window rendering).
 * On Android, use style props on OmiLocalCameraView/OmiRemoteCameraView instead.
 *
 * @param config.target - "local" or "remote"
 * @param config.x - X position
 * @param config.y - Y position
 * @param config.width - View width
 * @param config.height - View height
 * @param config.borderRadius - Corner radius
 * @param config.borderWidth - Border width
 * @param config.borderColor - Border color (hex: "#FF0000" or "#FF000080")
 * @param config.backgroundColor - Background color (hex)
 * @param config.opacity - View opacity (0.0 - 1.0)
 * @param config.hidden - Show/hide the view
 * @param config.scaleMode - Video scale: "fill" (aspect fill), "fit" (aspect fit), "stretch"
 * @returns {Promise<boolean>}
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
}): Promise<boolean> {
  if (Platform.OS === 'ios') {
    return OmikitPlugin.setCameraConfig(config);
  }
  return Promise.resolve(false);
}

/**
 * Create video containers and add to window (iOS only).
 * Call this when video call screen mounts and call is active.
 * On Fabric, RCTViewManager.view() is not called, so containers must be created manually.
 * @returns {Promise<boolean>}
 */
export function setupVideoContainers(): Promise<boolean> {
  if (Platform.OS === 'ios') {
    return OmikitPlugin.setupVideoContainers();
  }
  return Promise.resolve(true);
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
 *
 * Resolves as soon as the native SDK call returns — does NOT wait for the
 * HTTP `devices/remove` request or the local SIP state reset. Safe to use
 * when you don't need to log in again immediately.
 *
 * If you plan to call {@link initCallWithUserPassword} or
 * {@link initCallWithApiKey} right after, use {@link logoutAndWait} instead
 * to avoid a race between devices/remove and devices/add.
 *
 * @returns {Promise<boolean>} A promise that resolves to `true` if logout is successful.
 */
export function logout(): Promise<boolean> {
  return OmikitPlugin.logout();
}

/**
 * Logs out and waits for the SDK to fully finish its cleanup before resolving.
 *
 * Uses the SDK's native completion callback (iOS `logoutWithCompletion:`,
 * Android `OmiClient.logout(onCompleted)`) and only resolves once BOTH the
 * HTTP `devices/remove` round-trip AND the local SIP state reset have fired.
 * Use this whenever you plan to re-login immediately.
 *
 * @returns {Promise<boolean>} Resolves with the backend success flag. Even
 *   when the backend call fails (network error, timeout) the local state has
 *   still been cleaned up — you can safely proceed to re-login.
 *
 * @example
 * // Switch extensions cleanly
 * await logoutAndWait();
 * await initCallWithUserPassword(newCredentials);
 */
export function logoutAndWait(): Promise<boolean> {
  return OmikitPlugin.logoutAndWait();
}

/**
 * Registers for video call events.
 * @returns {Promise<boolean>} A promise that resolves to `true` if registration is successful.
 */
export function registerVideoEvent(): Promise<boolean> {
  return OmikitPlugin.registerVideoEvent();
}

/**
 * Setup video views by attaching native containers to React view tags.
 * Required for New Architecture (Fabric) where ViewManager.view() is not called.
 */
export function setupVideoViews(
  remoteTag: number,
  localTag: number
): Promise<boolean> {
  if (!OmikitPlugin.setupVideoViews) return Promise.resolve(false);
  return OmikitPlugin.setupVideoViews(remoteTag, localTag);
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

/**
 * End an calling
 * This function terminates an ongoing call as well as any incoming call. It sends the code 603 to the PBX, which triggers the “cancel ringing on other devices” mechanism.
 * 
 * @returns {Promise<boolean>} A promise that resolves to `true` if the call was successfully rejected, or `false` if an error occurred.
 */
export function dropCall(): Promise<boolean> {
  return OmikitPlugin.dropCall()
}


export function hideSystemNotificationSafely(): Promise<boolean> {
  return OmikitPlugin.hideSystemNotificationSafely();
}

export function hideSystemNotificationOnly(): Promise<boolean> {
  return OmikitPlugin.hideSystemNotificationOnly();
}

export function hideSystemNotificationAndUnregister(reason: string): Promise<boolean> {
  return OmikitPlugin.hideSystemNotificationAndUnregister({ reason });
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

/**
 * Check current permission status for VoIP calls (Android 15+ only)
 * @returns {Promise<any>} Permission status object (null on iOS)
 */
export function checkPermissionStatus(): Promise<any> {
  if (Platform.OS !== 'android') {
    return Promise.resolve(null);
  }
  return OmikitPlugin.checkPermissionStatus();
}

/**
 * Check and request permissions for VoIP calls (Android 15+ only)
 * @param {boolean} isVideo - Whether this is for video call (requires camera permission)
 * @returns {Promise<boolean>} True if all permissions granted (always true on iOS)
 */
export function checkAndRequestPermissions(isVideo: boolean = false): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return Promise.resolve(true);
  }
  return OmikitPlugin.checkAndRequestPermissions({ isVideo });
}

/**
 * Request system alert window permission (Android 15+ only)
 * @returns {Promise<boolean>} True if permission granted (always true on iOS)
 */
export function requestSystemAlertWindowPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return Promise.resolve(true);
  }
  return OmikitPlugin.requestSystemAlertWindowPermission();
}

/**
 * Request specific permissions by error codes 450, 451, 452 (Android only)
 * Shows permission request popup for customers to grant necessary permissions
 * @param {number[]} codes - Array of permission codes to request (450, 451, 452)
 * @returns {Promise<boolean>} True if all permissions granted (always true on iOS)
 */
export function requestPermissionsByCodes(codes: number[]): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return Promise.resolve(true);
  }
  return OmikitPlugin.requestPermissionsByCodes({ codes });
}

// MARK: - Getter Functions

/**
 * Retrieves user info by phone number.
 * @param {string} phone - The phone number to look up.
 * @returns {Promise<any>} User info object or null.
 */
export function getUserInfo(phone: string): Promise<any> {
  return OmikitPlugin.getUserInfo({ phone });
}

/**
 * Retrieves the project ID from OmiClient.
 * @returns {Promise<string | null>} The project ID or null.
 */
export function getProjectId(): Promise<string | null> {
  return OmikitPlugin.getProjectId();
}

/**
 * Retrieves SIP connection info (user@realm).
 * @returns {Promise<string | null>} SIP info string or null.
 */
export function getSipInfo(): Promise<string | null> {
  return OmikitPlugin.getSipInfo();
}

/**
 * Retrieves the app ID from OmiClient.
 * @returns {Promise<string | null>} The app ID or null.
 */
export function getAppId(): Promise<string | null> {
  return OmikitPlugin.getAppId();
}

/**
 * Retrieves the device ID from OmiClient.
 * @returns {Promise<string | null>} The device ID or null.
 */
export function getDeviceId(): Promise<string | null> {
  return OmikitPlugin.getDeviceId();
}

/**
 * Retrieves the FCM token from OmiClient.
 * @returns {Promise<string | null>} The FCM token or null.
 */
export function getFcmToken(): Promise<string | null> {
  return OmikitPlugin.getFcmToken();
}

/**
 * Retrieves the VoIP token (iOS only, Android returns null).
 * @returns {Promise<string | null>} The VoIP token or null.
 */
export function getVoipToken(): Promise<string | null> {
  return OmikitPlugin.getVoipToken();
}

// MARK: - Backend Device Registration Check APIs
// Mirrors OmiKit iOS 1.11.19 / OmiSDK Android 2.6.20+

/**
 * Single device entry returned by {@link getOmiDevices}.
 * Native bridge returns snake_case (matches SDK raw shape on both platforms);
 * this JS layer normalizes to camelCase so consumers don't deal with two cases.
 *
 * `deviceType` is normalized to `"ios"` / `"android"` (server raw int converted).
 * `sipNumber` is injected from the local session, not from the server payload.
 */
export type OmiDeviceInfo = {
  deviceId?: string;
  token?: string;
  deviceType?: 'ios' | 'android' | string;
  voipToken?: string;
  appId?: string;
  createdTime?: number;
  projectId?: string;
  sipNumber?: string;
};

/**
 * Raw native payload — snake_case as returned by the iOS/Android SDKs.
 * Kept private to this module; consumers receive the camelCase {@link OmiDeviceInfo}.
 */
type OmiDeviceInfoNative = {
  device_id?: string;
  token?: string;
  device_type?: 'ios' | 'android' | string;
  voip_token?: string;
  app_id?: string;
  created_time?: number;
  project_id?: string;
  sipNumber?: string;
};

function normalizeDevice(d: OmiDeviceInfoNative): OmiDeviceInfo {
  return {
    deviceId: d.device_id,
    token: d.token,
    deviceType: d.device_type,
    voipToken: d.voip_token,
    appId: d.app_id,
    createdTime: d.created_time,
    projectId: d.project_id,
    sipNumber: d.sipNumber,
  };
}

/**
 * Fetch the list of devices currently registered on the OMI backend for the
 * active SIP user. Returns an empty array when not logged in, on network
 * failure, or on parse error — never throws.
 *
 * Recommended usage: call once after login or on app foreground — do NOT
 * call in tight loops (each call performs a fresh HTTP request, no caching).
 *
 * @returns {Promise<OmiDeviceInfo[]>} Devices registered on backend (camelCase).
 */
export async function getOmiDevices(): Promise<OmiDeviceInfo[]> {
  const raw = (await OmikitPlugin.getOmiDevices()) as OmiDeviceInfoNative[] | null;
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeDevice);
}

/**
 * Verify whether THIS device (local `device_id` + `app_id`) is registered on
 * the OMI backend for the current SIP user. Returns `false` early when not
 * logged in, avoiding an unnecessary HTTP round trip.
 *
 * Use this to detect divergence between local session and backend state —
 * e.g. after app reinstall, backend cleanup, or device migration.
 */
export function isCurrentDeviceRegistered(): Promise<boolean> {
  return OmikitPlugin.isCurrentDeviceRegistered();
}

/**
 * Convenience guard built on top of {@link isCurrentDeviceRegistered}.
 * Returns `true` when a SIP user is set locally but no matching device exists
 * on the backend — i.e. the local session is stale and the user must logout
 * + login again to re-register.
 *
 * Returns `false` when not logged in (nothing to recover) or when the
 * registration is intact. Recommended call sites: app foreground, before
 * critical operations.
 */
export function needsReLogin(): Promise<boolean> {
  return OmikitPlugin.needsReLogin();
}

/**
 * Look up the SIP number associated with a given `deviceId` in a devices list
 * returned by {@link getOmiDevices}.
 *
 * Use case: after fetching the backend device list, verify which SIP extension
 * is currently bound to THIS device — useful when one user can hold multiple
 * extensions, or when troubleshooting a wrong-extension issue.
 *
 * @param devices - Array returned by {@link getOmiDevices}.
 * @param deviceId - Local device identifier (typically from {@link getDeviceId}).
 * @returns The `sipNumber` of the matched entry, or `null` if no device in the
 *   list has that `deviceId` (or if inputs are missing/empty).
 *
 * @example
 * const devices = await getOmiDevices();
 * const localDeviceId = await getDeviceId();
 * const sip = findSipNumberByDeviceId(devices, localDeviceId);
 * if (sip == null) {
 *   // backend has no record of this device — session stale, ask user to re-login
 * } else if (sip !== expectedExtension) {
 *   // device is bound to a different extension than expected
 * }
 */
export function findSipNumberByDeviceId(
  devices: OmiDeviceInfo[] | null | undefined,
  deviceId: string | null | undefined
): string | null {
  if (!Array.isArray(devices) || devices.length === 0) return null;
  if (!deviceId) return null;
  const match = devices.find((d) => d.deviceId === deviceId);
  return match?.sipNumber ?? null;
}

/**
 * Gets the current keep-alive connection status.
 * @returns {Promise<any>} Keep-alive status object.
 */
export function getKeepAliveStatus(): Promise<any> {
  return OmikitPlugin.getKeepAliveStatus();
}

/**
 * Manually triggers a keep-alive ping to maintain the SIP connection.
 * @returns {Promise<boolean>} True if the ping was sent successfully.
 */
export function triggerKeepAlivePing(): Promise<boolean> {
  return OmikitPlugin.triggerKeepAlivePing();
}

