import { withDefaults } from '../types';
import { withOmikitAndroidManifest } from '../android/withManifest';
import { withOmikitProjectGradle } from '../android/withProjectGradle';

/** Minimal AndroidManifest object mirroring @expo/config-plugins shape. */
function makeManifest() {
  return {
    manifest: {
      $: { 'xmlns:android': 'http://schemas.android.com/apk/res/android' },
      'uses-permission': [],
      application: [
        {
          $: { 'android:name': '.MainApplication' },
          activity: [
            {
              $: { 'android:name': '.MainActivity' },
              'intent-filter': [
                {
                  action: [{ $: { 'android:name': 'android.intent.action.MAIN' } }],
                  category: [
                    { $: { 'android:name': 'android.intent.category.LAUNCHER' } },
                  ],
                },
              ],
            },
          ],
          'meta-data': [],
        },
      ],
    },
  };
}

async function runManifest(props: any) {
  const config: any = { name: 't', slug: 't', android: {}, mods: {} };
  const out = withOmikitAndroidManifest(config, props);
  const modFn = out.mods.android.manifest;
  const result = await modFn({
    ...out,
    modResults: makeManifest(),
    modRequest: {} as any,
  });
  return result.modResults.manifest;
}

async function runGradle(props: any, contents: string) {
  const config: any = { name: 't', slug: 't', android: {}, mods: {} };
  const out = withOmikitProjectGradle(config, props);
  const modFn = out.mods.android.projectBuildGradle;
  const result = await modFn({
    ...out,
    modResults: { language: 'groovy', contents },
    modRequest: {} as any,
  });
  return result.modResults.contents;
}

const permNames = (manifest: any) =>
  (manifest['uses-permission'] || []).map((p: any) => ({
    name: p.$['android:name'],
    node: p.$['tools:node'],
  }));

describe('Android manifest mod', () => {
  it('adds base permissions', async () => {
    const m = await runManifest(withDefaults({}));
    const names = permNames(m).map((p: any) => p.name);
    expect(names).toEqual(
      expect.arrayContaining([
        'android.permission.INTERNET',
        'android.permission.RECORD_AUDIO',
        'android.permission.POST_NOTIFICATIONS',
        'android.permission.FOREGROUND_SERVICE',
        'android.permission.FOREGROUND_SERVICE_PHONE_CALL',
        'android.permission.FOREGROUND_SERVICE_MICROPHONE',
        'android.permission.SYSTEM_ALERT_WINDOW',
        'android.permission.USE_FULL_SCREEN_INTENT',
      ])
    );
  });

  it('removes FOREGROUND_SERVICE_CAMERA and omits CAMERA when video disabled', async () => {
    const m = await runManifest(withDefaults({ enableVideo: false }));
    const perms = permNames(m);
    expect(perms).toContainEqual({
      name: 'android.permission.FOREGROUND_SERVICE_CAMERA',
      node: 'remove',
    });
    expect(perms.find((p: any) => p.name === 'android.permission.CAMERA')).toBeUndefined();
    expect(m.$['xmlns:tools']).toBe('http://schemas.android.com/tools');
  });

  it('adds CAMERA when video enabled', async () => {
    const m = await runManifest(withDefaults({ enableVideo: true }));
    const names = permNames(m).map((p: any) => p.name);
    expect(names).toContain('android.permission.CAMERA');
  });

  it('sets MainActivity attributes', async () => {
    const m = await runManifest(withDefaults({}));
    const act = m.application[0].activity[0];
    expect(act.$['android:showWhenLocked']).toBe('true');
    expect(act.$['android:turnScreenOn']).toBe('true');
    expect(act.$['android:launchMode']).toBe('singleTask');
  });

  it('adds the incoming-call intent-filter once (idempotent)', async () => {
    const m = await runManifest(withDefaults({}));
    const filters = m.application[0].activity[0]['intent-filter'];
    const omi = filters.filter((f: any) =>
      (f.data || []).some((d: any) => d.$['android:scheme'] === 'omisdk')
    );
    expect(omi).toHaveLength(1);
    expect(omi[0].data[0].$['android:host']).toBe('incoming_call');
  });

  it('writes SDK config meta-data', async () => {
    const m = await runManifest(withDefaults({ environment: 'sandbox', maxCall: 3 }));
    const meta = m.application[0]['meta-data'];
    const get = (n: string) =>
      meta.find((x: any) => x.$['android:name'] === n)?.$['android:value'];
    expect(get('vn.vihat.omikit.environment')).toBe('sandbox');
    expect(get('vn.vihat.omikit.maxCall')).toBe('3');
    expect(get('vn.vihat.omikit.enableVideo')).toBe('false');
  });

  it('flattens on-premise into meta-data', async () => {
    const m = await runManifest(
      withDefaults({ onPremise: { sipProxy: '10.0.0.1:5222', callEventHost: '' } })
    );
    const meta = m.application[0]['meta-data'];
    const get = (n: string) =>
      meta.find((x: any) => x.$['android:name'] === n)?.$['android:value'];
    expect(get('vn.vihat.omikit.onpremise.sipProxy')).toBe('10.0.0.1:5222');
    expect(get('vn.vihat.omikit.onpremise.callEventHost')).toBeUndefined();
  });
});

describe('Android project build.gradle mod', () => {
  const gradle = `allprojects {
    repositories {
        google()
        mavenCentral()
    }
}`;

  it('injects the maven repos', async () => {
    const out = await runGradle(withDefaults({}), gradle);
    expect(out).toContain('https://jitpack.io');
    // omi-sdk lives on GitHub Packages (private) — needs OMI_USER/OMI_TOKEN.
    expect(out).toContain('https://maven.pkg.github.com/omicall/OMICall-SDK');
    expect(out).toContain('OMI_TOKEN');
  });

  it('is idempotent', async () => {
    const once = await runGradle(withDefaults({}), gradle);
    const twice = await runGradle(withDefaults({}), once);
    const count = (twice.match(/OMICall-SDK/g) || []).length;
    expect(count).toBe(1);
  });
});
