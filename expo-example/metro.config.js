// Metro config for the Expo example.
//
// `omikit-plugin` lives at the repo root (this example is a subfolder of the
// package it demos). Instead of symlinking the whole repo into node_modules
// — which drags the repo-root node_modules + the bare example into Metro's
// graph and causes duplicate-react-native haste collisions — we resolve the
// `omikit-plugin` specifier straight to the package root and only watch the
// source folders Metro actually needs.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const repoRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// Watch only the package's own JS sources (not the repo-root node_modules or
// the bare example), so Metro can read omikit-plugin's src/lib without pulling
// a second copy of react-native.
config.watchFolders = [
  path.resolve(repoRoot, 'src'),
  path.resolve(repoRoot, 'lib'),
];

// Resolve modules from the app's node_modules only — keeps react / react-native
// singletons unique.
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, 'node_modules')];

// Map the bare `omikit-plugin` specifier (and deep imports) to the repo root.
const pkgRoot = repoRoot;
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'omikit-plugin') {
    // Use the RN source entry so Metro transforms TS the same as the app code.
    return {
      type: 'sourceFile',
      filePath: path.resolve(pkgRoot, 'src/index.tsx'),
    };
  }
  if (moduleName.startsWith('omikit-plugin/')) {
    const sub = moduleName.replace('omikit-plugin/', '');
    return context.resolveRequest(context, path.resolve(pkgRoot, sub), platform);
  }
  return (defaultResolveRequest || context.resolveRequest)(
    context,
    moduleName,
    platform
  );
};

module.exports = config;
