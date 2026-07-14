import { ConfigPlugin, createRunOncePlugin } from '@expo/config-plugins';

import { OmikitPluginProps, withDefaults } from './types';
import { withOmikitInfoPlist } from './ios/withInfoPlist';
import { withOmikitEntitlements } from './ios/withEntitlements';
import { withOmikitAndroidManifest } from './android/withManifest';
import { withOmikitProjectGradle } from './android/withProjectGradle';

const pkg = require('../../package.json');

/**
 * omikit-plugin Expo config plugin.
 *
 * Automates every native change a consuming Expo app needs so that
 * `npx expo install omikit-plugin` + adding this plugin to app.json is enough
 * to use the VoIP/SIP SDK — no manual AppDelegate / MainActivity / Info.plist /
 * AndroidManifest / build.gradle edits.
 *
 * The OmiKit runtime init itself is handled by native Expo lifecycle
 * subscribers shipped in the SDK (iOS ExpoAppDelegateSubscriber + Android
 * ReactActivityLifecycleListener), not by injecting code here.
 */
const withOmikit: ConfigPlugin<OmikitPluginProps | void> = (config, rawProps) => {
  const props = withDefaults(rawProps || {});

  // iOS. No AppDelegate edit needed: the pod's OmikitExpoAppDelegateBridge.m
  // self-registers as an Expo AppDelegate subscriber at +load time and runs the
  // OmiKit VoIP/PushKit init. The plugin only writes Info.plist + entitlements.
  config = withOmikitInfoPlist(config, props);
  config = withOmikitEntitlements(config, props);

  // Android
  config = withOmikitAndroidManifest(config, props);
  config = withOmikitProjectGradle(config, props);

  return config;
};

export default createRunOncePlugin(withOmikit, pkg.name, pkg.version);
