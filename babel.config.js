module.exports = function (api) {
  api.cache(true);
  // Il plugin di reanimated/worklets è aggiunto in automatico da babel-preset-expo
  return {
    presets: ['babel-preset-expo'],
  };
};
