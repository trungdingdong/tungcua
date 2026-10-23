module.exports = function (api) {
  const isTest = !!process.env.JEST_WORKER_ID || process.env.NODE_ENV === 'test';
  api.cache.using(() => (isTest ? 'test' : 'default'));

  // Jest renders core React Native components; keep className as a plain prop
  // so component tests do not need the NativeWind CSS runtime.
  if (isTest) {
    return {
      presets: ['babel-preset-expo'],
    };
  }

  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  };
};
