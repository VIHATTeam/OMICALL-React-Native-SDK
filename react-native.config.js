module.exports = {
  dependency: {
    platforms: {
      ios: {},
      android: {},
    },
  },
  // Enable Fabric interop for legacy ViewManagers (OmiLocalCameraView, OmiRemoteCameraView)
  // This allows requireNativeComponent to work with New Architecture (Fabric)
  unstable_reactLegacyComponentNames: [
    'OmiLocalCameraView',
    'OmiRemoteCameraView',
  ],
};
