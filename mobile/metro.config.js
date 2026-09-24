const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
// Bundle the on-device jaundice model.
config.resolver.assetExts.push('tflite');

module.exports = config;
