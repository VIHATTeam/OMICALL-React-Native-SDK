import { AndroidConfig, ConfigPlugin, withAndroidManifest } from '@expo/config-plugins';

import { OmikitOnPremiseProps, OmikitPluginProps } from '../types';

type ManifestApplication =
  AndroidConfig.Manifest.ManifestApplication;

const TOOLS_NS = 'http://schemas.android.com/tools';

/** Permissions every OmiCall app needs. CAMERA is added only for video. */
const BASE_PERMISSIONS = [
  'android.permission.INTERNET',
  'android.permission.RECORD_AUDIO',
  'android.permission.POST_NOTIFICATIONS',
  'android.permission.FOREGROUND_SERVICE',
  'android.permission.FOREGROUND_SERVICE_PHONE_CALL',
  'android.permission.FOREGROUND_SERVICE_MICROPHONE',
  'android.permission.SYSTEM_ALERT_WINDOW',
  'android.permission.USE_FULL_SCREEN_INTENT',
  'android.permission.MODIFY_AUDIO_SETTINGS',
];

/** Ensure a <uses-permission> exists (idempotent). */
function ensurePermission(manifest: any, name: string) {
  manifest['uses-permission'] = manifest['uses-permission'] || [];
  const list: any[] = manifest['uses-permission'];
  const found = list.find((p) => p.$?.['android:name'] === name);
  if (!found) {
    list.push({ $: { 'android:name': name } });
  }
}

/** Add a <uses-permission tools:node="remove"> to strip an SDK-declared perm. */
function removePermission(manifest: any, name: string) {
  manifest['uses-permission'] = manifest['uses-permission'] || [];
  const list: any[] = manifest['uses-permission'];
  const found = list.find(
    (p) => p.$?.['android:name'] === name && p.$?.['tools:node'] === 'remove'
  );
  if (!found) {
    list.push({ $: { 'android:name': name, 'tools:node': 'remove' } });
  }
}

/** Find the launcher/main activity (the one Expo names ".MainActivity"). */
function getMainActivity(application: ManifestApplication): any | undefined {
  const activities = application.activity || [];
  return (
    activities.find((a: any) =>
      (a['intent-filter'] || []).some((f: any) =>
        (f.action || []).some(
          (act: any) =>
            act.$?.['android:name'] === 'android.intent.action.MAIN'
        )
      )
    ) || activities[0]
  );
}

/** OmiCall incoming-call intent-filter (lock-screen routing). */
function ensureIncomingCallIntentFilter(activity: any) {
  activity['intent-filter'] = activity['intent-filter'] || [];
  const filters: any[] = activity['intent-filter'];
  const alreadyThere = filters.some((f: any) =>
    (f.data || []).some(
      (d: any) =>
        d.$?.['android:scheme'] === 'omisdk' &&
        d.$?.['android:host'] === 'incoming_call'
    )
  );
  if (alreadyThere) return;
  filters.push({
    action: [
      { $: { 'android:name': '${applicationId}.ACTION_INCOMING_CALL' } },
      { $: { 'android:name': 'android.intent.action.CALL' } },
    ],
    category: [{ $: { 'android:name': 'android.intent.category.DEFAULT' } }],
    data: [{ $: { 'android:host': 'incoming_call', 'android:scheme': 'omisdk' } }],
  });
}

/** Write a <meta-data> entry (idempotent) on <application>. */
function setMetaData(
  application: ManifestApplication,
  name: string,
  value: string
) {
  application['meta-data'] = application['meta-data'] || [];
  const list: any[] = application['meta-data'];
  const found = list.find((m) => m.$?.['android:name'] === name);
  if (found) {
    found.$['android:value'] = value;
  } else {
    list.push({ $: { 'android:name': name, 'android:value': value } });
  }
}

/** Flatten on-premise props to individual meta-data entries. */
function setOnPremiseMetaData(
  application: ManifestApplication,
  onPremise?: OmikitOnPremiseProps
) {
  if (!onPremise) return;
  for (const [key, value] of Object.entries(onPremise)) {
    if (typeof value === 'string' && value.length > 0) {
      setMetaData(
        application,
        `vn.vihat.omikit.onpremise.${key}`,
        value
      );
    }
  }
}

export const withOmikitAndroidManifest: ConfigPlugin<
  OmikitPluginProps & {
    environment: 'sandbox' | 'production';
    enableVideo: boolean;
    userNameKey: string;
    maxCall: number;
    callKitImage: string;
    typePushVoip: 'default' | 'callkit';
  }
> = (config, props) => {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest as any;

    // Ensure tools namespace for tools:node removals.
    manifest.$ = manifest.$ || {};
    if (!manifest.$['xmlns:tools']) {
      manifest.$['xmlns:tools'] = TOOLS_NS;
    }

    // --- Permissions ---
    for (const p of BASE_PERMISSIONS) ensurePermission(manifest, p);
    if (props.enableVideo) {
      ensurePermission(manifest, 'android.permission.CAMERA');
    } else {
      // Audio-only: strip the SDK's camera foreground-service permission.
      removePermission(manifest, 'android.permission.FOREGROUND_SERVICE_CAMERA');
    }

    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(
      cfg.modResults
    );

    // --- MainActivity attributes + incoming-call intent-filter ---
    const activity = getMainActivity(application);
    if (activity) {
      activity.$ = activity.$ || {};
      activity.$['android:showWhenLocked'] = 'true';
      activity.$['android:turnScreenOn'] = 'true';
      activity.$['android:launchMode'] = 'singleTask';
      ensureIncomingCallIntentFilter(activity);
    }

    // --- SDK config the native lifecycle listener reads at launch ---
    setMetaData(application, 'vn.vihat.omikit.environment', props.environment);
    setMetaData(application, 'vn.vihat.omikit.userNameKey', props.userNameKey);
    setMetaData(application, 'vn.vihat.omikit.maxCall', String(props.maxCall));
    setMetaData(application, 'vn.vihat.omikit.callKitImage', props.callKitImage);
    setMetaData(application, 'vn.vihat.omikit.typePushVoip', props.typePushVoip);
    setMetaData(
      application,
      'vn.vihat.omikit.enableVideo',
      String(props.enableVideo)
    );
    setOnPremiseMetaData(application, props.onPremise);

    return cfg;
  });
};
