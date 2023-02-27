import { NativeModules, Platform } from 'react-native';

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

export function multiply(a: number, b: number): Promise<number> {
  return OmikitPlugin.multiply(a, b);
}

export function updateToken(data: any): Promise<void> {
  return OmikitPlugin.updateToken(data);
}

export function initCall(data: any): Promise<boolean> {
  return OmikitPlugin.initCall(data);
}
