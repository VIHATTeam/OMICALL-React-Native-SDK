const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

const defaultConfig = getDefaultConfig(__dirname);

const {
  resolver: { sourceExts, assetExts },
} = defaultConfig;

// Cấu hình bổ sung cho việc sử dụng plugin nội bộ
const extraNodeModules = {
  'omikit-plugin': path.resolve(__dirname, '../'),
};

const watchFolders = [path.resolve(__dirname, '../')];

// ⚡️ Cấu hình Metro hỗ trợ SVG, hình ảnh & plugin nội bộ
const config = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  resolver: {
    extraNodeModules
  },
  watchFolders, // ✅ Hỗ trợ cập nhật plugin nội bộ mà không cần restart
};

module.exports = mergeConfig(defaultConfig, config);