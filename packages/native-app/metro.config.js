const { withNativeWind } = require('nativewind/metro');
const {
  getSentryExpoConfig
} = require("@sentry/react-native/metro");

const config = getSentryExpoConfig(__dirname);

// Configure SVG transformer
const { transformer, resolver } = config;

config.transformer = {
  ...transformer,
  babelTransformerPath: require.resolve("react-native-svg-transformer/expo")
};

config.resolver = {
  ...resolver,
  assetExts: [
    ...resolver.assetExts.filter((ext) => ext !== "svg"),
    "htmlx",
    "lottie",
    "wasm",
  ],
  sourceExts: [...resolver.sourceExts, "svg"]
};

// Apply NativeWind after SVG configuration
module.exports = withNativeWind(config, { input: './src/styles/global.css' });
