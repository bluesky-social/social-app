// @ts-check

module.exports = {
  hashAlgorithm: 'sha1',
  sourceSkips: [
    'ExpoConfigVersions',
    'PackageJsonAndroidAndIosScriptsIfNotContainRun',
  ],
  extraSources: [
    {
      type: 'file',
      filePath: 'scripts/ota/fingerprint-policy.json',
      overrideHashKey: 'fingerprint-policy.json',
      reasons: ['Repository OTA compatibility policy'],
    },
    ...(process.env.EAS_BUILD_PLATFORM === 'ios'
      ? ['BlueskyClip', 'BlueskyNSE', 'Share-with-Bluesky'].map(name => ({
          type: 'dir',
          filePath: `modules/${name}`,
          overrideHashKey: `native-extension/${name}`,
          reasons: ['Native extension sources copied by config plugins'],
        }))
      : []),
  ],
}
