const getIosBuildNumber = config =>
  process.env.BSKY_IOS_BUILD_NUMBER ?? config.ios?.buildNumber ?? '1'

module.exports = {getIosBuildNumber}
