import { ConfigPlugin, withProjectBuildGradle } from '@expo/config-plugins';

import { OmikitPluginProps } from '../types';

const MARKER = 'omikit-plugin maven repos';

// Repositories that serve io.omicrm.vihat:omi-sdk.
//   - jitpack: public, some transitive deps.
//   - GitHub Packages (omicall/OMICall-SDK): the actual omi-sdk artifacts.
//     Requires credentials — read from OMI_USER / OMI_TOKEN (env var or gradle
//     property) so the token is NOT committed. Set them in
//     android/gradle.properties (gitignored) or the EAS/CI environment.
//   NOTE: repo.omicall.com/maven is a website, not a Maven repo — do not use it.
const REPO_BLOCK = `        // ${MARKER} (added by omikit-plugin config plugin)
        maven { url 'https://jitpack.io' }
        maven {
            url 'https://maven.pkg.github.com/omicall/OMICall-SDK'
            credentials {
                username = System.getenv('OMI_USER') ?: (project.findProperty('OMI_USER') ?: '')
                password = System.getenv('OMI_TOKEN') ?: (project.findProperty('OMI_TOKEN') ?: '')
            }
            authentication { basic(BasicAuthentication) }
        }`;

/**
 * Injects the OmiCall maven repositories into the app's root build.gradle so
 * Gradle can resolve io.omicrm.vihat:omi-sdk.
 *
 * omi-sdk is hosted on GitHub Packages (private) and needs OMI_USER / OMI_TOKEN
 * credentials. This mod adds the repo with a credentials block that reads those
 * from the environment or a gradle property, so no token is written into a
 * committed file.
 *
 * Handles BOTH gradle layouts Expo may generate:
 *   - `allprojects { repositories { ... } }` in root build.gradle, and
 *   - `dependencyResolutionManagement { repositories { ... } }` in
 *     settings.gradle (Gradle 7+; if present it usually wins and the
 *     build.gradle repos are ignored). The settings.gradle case is patched by
 *     withOmikitSettingsGradle (see index.ts).
 * Idempotent (guarded by a marker comment).
 */
export const withOmikitProjectGradle: ConfigPlugin<OmikitPluginProps> = (config) => {
  return withProjectBuildGradle(config, (cfg) => {
    let contents = cfg.modResults.contents;

    if (contents.includes(MARKER)) {
      return cfg; // already added
    }

    // Insert right after the first `allprojects { repositories {`.
    const anchor = /allprojects\s*\{[\s\S]*?repositories\s*\{/;
    const match = contents.match(anchor);
    if (match && match.index !== undefined) {
      const insertAt = match.index + match[0].length;
      contents =
        contents.slice(0, insertAt) + '\n' + REPO_BLOCK + contents.slice(insertAt);
      cfg.modResults.contents = contents;
    }

    return cfg;
  });
};
