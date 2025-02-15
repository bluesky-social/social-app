module.exports = function withNoCompress(config) {
  config.android = config.android || {};
  config.android.androidResources = config.android.androidResources || {};
  config.android.androidResources.noCompress = config.android.androidResources.noCompress || [];

  // Add .bundle files to `noCompress` list so JS bundle isnt compressed
  if (!config.android.androidResources.noCompress.includes('bundle')) {
    config.android.androidResources.noCompress.push('bundle');
  }

  return config;
};
