const {withProjectBuildGradle} = require('@expo/config-plugins')

const jitpackRepository = "maven { url 'https://www.jitpack.io' }"

module.exports = function withAndroidNoJitpackPlugin(config) {
  return withProjectBuildGradle(config, config => {
    if (!config.modResults.contents.includes(jitpackRepository)) {
      throw Error(
        'Expected to find the jitpack string in the config. ' +
          'You MUST verify whether it was actually removed upstream, ' +
          'or if the format has changed and this plugin no longer recognizes it.',
      )
    }
    config.modResults.contents = config.modResults.contents.replaceAll(
      jitpackRepository,
      '',
    )
    return config
  })
}
