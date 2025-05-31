const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
    watchFolders: [
        // Include the parent directory to watch for changes in the plugin
        path.resolve(__dirname, '..'),
    ],
    resolver: {
        alias: {
            // Map omikit-plugin to the parent directory
            'omikit-plugin': path.resolve(__dirname, '..'),
        },
    },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
