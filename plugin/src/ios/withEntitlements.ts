import { ConfigPlugin, withEntitlementsPlist } from '@expo/config-plugins';

import { OmikitPluginProps } from '../types';

/**
 * Adds the `aps-environment` entitlement — required for PushKit VoIP push
 * (the "Push Notifications" capability). Default 'development'; EAS/App Store
 * builds should set 'production' via props.apsEnvironment.
 */
export const withOmikitEntitlements: ConfigPlugin<
  OmikitPluginProps & { apsEnvironment: 'development' | 'production' }
> = (config, props) => {
  return withEntitlementsPlist(config, (cfg) => {
    cfg.modResults['aps-environment'] =
      cfg.modResults['aps-environment'] || props.apsEnvironment;
    return cfg;
  });
};
