module.exports = {
  project: {
    android: {
      sourceDir: './android',
      packageName: 'com.omikitpluginexample',
    },
  },
  dependencies: {
    'react-native-gesture-handler': {
      platforms: {
        android: null,
      },
    },
    // Disable autolinking for omikit-plugin - manually added in MainApplication.kt
    'omikit-plugin': {
      platforms: {
        android: null,
        ios: null,
      },
    },
  },
};