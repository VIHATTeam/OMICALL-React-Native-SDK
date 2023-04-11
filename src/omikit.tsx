import { NativeModules, Platform, NativeEventEmitter } from 'react-native';

const LINKING_ERROR =
  `The package 'omikit-plugin' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

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

export function startServices(): Promise<any> {
  return OmikitPlugin.startServices();
}

export function configPushNotification(data: any): Promise<any> {
  return OmikitPlugin.configPushNotification(data);
}

export function getInitialCall(): Promise<any> {
  return OmikitPlugin.getInitialCall();
}

export function initCallWithUserPassword(data: any): Promise<boolean> {
  console.log(data);
  return OmikitPlugin.initCallWithUserPassword(data);
}

export function initCallWithApiKey(data: any): Promise<boolean> {
  console.log(data);
  return OmikitPlugin.initCallWithApiKey(data);
}

export function updateToken(data: any): Promise<void> {
  console.log(data);
  return OmikitPlugin.updateToken(data);
}

export function startCall(data: any): Promise<boolean> {
  console.log(data);
  return OmikitPlugin.startCall(data);
}

export function startCallWithUuid(data: any): Promise<boolean> {
  console.log(data);
  return OmikitPlugin.startCallWithUuid(data);
}

export function joinCall(): Promise<boolean> {
  return OmikitPlugin.joinCall();
}

export function endCall(): Promise<boolean> {
  return OmikitPlugin.endCall();
}

export function toggleMute(): Promise<boolean> {
  return OmikitPlugin.toggleMute();
}

export function toggleSpeaker(): Promise<boolean> {
  return OmikitPlugin.toggleSpeaker();
}

export function onHold(data: any): Promise<boolean> {
  return OmikitPlugin.onHold(data);
}

export function sendDTMF(data: any): Promise<boolean> {
  return OmikitPlugin.sendDTMF(data);
}

export const omiEmitter = new NativeEventEmitter(OmikitPlugin);

export const OmiCallEvent = {
  onCallEstablished: 'CALL_ESTABLISHED',
  onCallEnd: 'CALL_END',
  incomingReceived: 'INCOMING_RECEIVED',
  onSpeaker: 'SPEAKER',
  onMuted: 'MUTED',
  // onVideo: 'VIDEO',
};