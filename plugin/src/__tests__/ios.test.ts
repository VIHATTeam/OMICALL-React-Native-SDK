import { withDefaults } from '../types';
import { withOmikitInfoPlist } from '../ios/withInfoPlist';
import { withOmikitEntitlements } from '../ios/withEntitlements';

/** Minimal fake ExpoConfig with an Info.plist mod result. */
function makeConfig(): any {
  return {
    name: 'test',
    slug: 'test',
    modResults: {},
    ios: {},
  };
}

/**
 * Runs an Info.plist config-plugin mod synchronously by invoking the
 * registered mod function directly. @expo/config-plugins withInfoPlist wraps
 * the callback in config._internal mods; for a unit test we invoke the inner
 * callback via the mod chain. Simplest: call the mod, then execute the queued
 * plist mod against a fresh modResults.
 */
async function runInfoPlist(props: any) {
  const config: any = { name: 't', slug: 't', ios: {}, mods: {} };
  const out = withOmikitInfoPlist(config, props);
  // The mod is queued under mods.ios.infoPlist — execute it.
  const modFn = out.mods.ios.infoPlist;
  const result = await modFn({
    ...out,
    modResults: {},
    modRequest: {} as any,
  });
  return result.modResults;
}

async function runEntitlements(props: any) {
  const config: any = { name: 't', slug: 't', ios: {}, mods: {} };
  const out = withOmikitEntitlements(config, props);
  const modFn = out.mods.ios.entitlements;
  const result = await modFn({
    ...out,
    modResults: {},
    modRequest: {} as any,
  });
  return result.modResults;
}

describe('iOS Info.plist mod', () => {
  it('sets microphone permission but not camera when video disabled', async () => {
    const plist = await runInfoPlist(withDefaults({}));
    expect(plist.NSMicrophoneUsageDescription).toBeTruthy();
    expect(plist.NSCameraUsageDescription).toBeUndefined();
  });

  it('sets camera permission when enableVideo', async () => {
    const plist = await runInfoPlist(withDefaults({ enableVideo: true }));
    expect(plist.NSCameraUsageDescription).toBeTruthy();
  });

  it('merges required background modes', async () => {
    const plist = await runInfoPlist(withDefaults({}));
    expect(plist.UIBackgroundModes).toEqual(
      expect.arrayContaining(['voip', 'remote-notification', 'fetch'])
    );
  });

  it('writes SDK config keys', async () => {
    const plist = await runInfoPlist(
      withDefaults({ environment: 'sandbox', maxCall: 2 })
    );
    expect(plist.OMIKitEnvironment).toBe('sandbox');
    expect(plist.OMIKitMaxCall).toBe(2);
    expect(plist.OMIKitCallKitImage).toBe('call_image');
  });

  it('writes on-premise dict stripping empty fields', async () => {
    const plist = await runInfoPlist(
      withDefaults({
        onPremise: { mobileSdkHost: 'omisdk.x.vn', callEventHost: '' },
      })
    );
    expect(plist.OMIKitOnPremise).toEqual({ mobileSdkHost: 'omisdk.x.vn' });
  });

  it('omits on-premise dict when all fields empty', async () => {
    const plist = await runInfoPlist(withDefaults({ onPremise: {} }));
    expect(plist.OMIKitOnPremise).toBeUndefined();
  });
});

describe('iOS entitlements mod', () => {
  it('sets aps-environment', async () => {
    const ent = await runEntitlements(withDefaults({}));
    expect(ent['aps-environment']).toBe('development');
  });

  it('respects production apsEnvironment', async () => {
    const ent = await runEntitlements(withDefaults({ apsEnvironment: 'production' }));
    expect(ent['aps-environment']).toBe('production');
  });
});
