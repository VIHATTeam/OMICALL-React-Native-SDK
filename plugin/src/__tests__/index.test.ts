import withOmikit from '../index';

/**
 * Verifies the top-level plugin composes all mods and queues iOS + Android
 * mods without throwing. Full field assertions live in ios/android tests.
 */
describe('withOmikit (integration)', () => {
  function baseConfig(): any {
    return { name: 't', slug: 't', ios: {}, android: {}, mods: {} };
  }

  it('queues iOS and Android mods with default props', () => {
    const out: any = withOmikit(baseConfig(), undefined as any);
    expect(out.mods.ios.infoPlist).toBeInstanceOf(Function);
    expect(out.mods.ios.entitlements).toBeInstanceOf(Function);
    expect(out.mods.android.manifest).toBeInstanceOf(Function);
    expect(out.mods.android.projectBuildGradle).toBeInstanceOf(Function);
  });

  it('accepts full props including on-premise', () => {
    const out: any = withOmikit(baseConfig(), {
      environment: 'sandbox',
      enableVideo: true,
      maxCall: 2,
      callKitImage: 'my_image',
      onPremise: { mobileSdkHost: 'omisdk.chailease.com.vn', sipProxy: '10.0.0.1' },
    } as any);
    expect(out.mods.ios.infoPlist).toBeInstanceOf(Function);
  });

  it('runs once (createRunOncePlugin guards double application)', () => {
    let cfg: any = baseConfig();
    cfg = withOmikit(cfg, undefined as any);
    // Second application should be a no-op re-run, not throw.
    expect(() => withOmikit(cfg, undefined as any)).not.toThrow();
  });
});
