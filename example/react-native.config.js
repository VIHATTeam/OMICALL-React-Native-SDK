module.exports = {
  project: {
    android: {
      sourceDir: './android',
      packageName: 'com.omikitpluginexample',
      // Register legacy ViewManagers for Fabric interop (New Architecture)
      unstable_reactLegacyComponentNames: [
        'OmiLocalCameraView',
        'OmiRemoteCameraView',
      ],
    },
    ios: {
      // Register legacy ViewManagers for Fabric interop (New Architecture)
      unstable_reactLegacyComponentNames: [
        'OmiLocalCameraView',
        'OmiRemoteCameraView',
      ],
    },
  },
  dependencies: {
    'react-native-gesture-handler': {
      platforms: {
        android: null,
      },
    },
    // Disable autolinking — manually added via pod 'omikit-plugin', :path in Podfile
    'omikit-plugin': {
      platforms: {
        android: null,
        ios: null,
      },
    },
  },
};