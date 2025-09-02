module.exports = function(api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: [
      // React Native Reanimated plugin needs to be last
      'react-native-reanimated/plugin',
    ],
  };
};