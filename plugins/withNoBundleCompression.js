const {withAppBuildGradle} = require('@expo/config-plugins')

/**
 * A Config Plugin to disable bundle compression in Android build.gradle.
 * @param {import('@expo/config-plugins').ConfigPlugin} config
 * @returns {import('@expo/config-plugins').ConfigPlugin}
 */
module.exports = function withNoBundleCompression(config) {
  return withAppBuildGradle(config, androidConfig => {
    let buildGradle = androidConfig.modResults.contents

    const hasAndroidResources = buildGradle.includes('androidResources {')
    const hasNoCompress = buildGradle.includes('noCompress')

    if (hasAndroidResources) {
      if (hasNoCompress) {
        if (
          buildGradle.includes('noCompress += ["bundle"]') ||
          buildGradle.includes("noCompress += 'bundle'") ||
          buildGradle.includes('noCompress += "bundle"')
        ) {
          return androidConfig
        }

        const lines = buildGradle.split('\n')
        const modifiedLines = lines.map(line => {
          if (line.trim().startsWith('noCompress')) {
            if (line.includes('+=')) {
              return line.replace(/\]/, ', "bundle"]')
            } else if (line.includes('=')) {
              return line.replace('=', '+= ["bundle",') + ']'
            }
          }
          return line
        })
        androidConfig.modResults.contents = modifiedLines.join('\n')
      } else {
        const androidResources = buildGradle.indexOf('androidResources {')
        if (androidResources === -1) {
          throw new Error(
            `Cannot find androidResources { block in build.gradle!`,
          )
        }
        const insertPosition = buildGradle.indexOf('\n', androidResources) + 1
        const newContent =
          buildGradle.slice(0, insertPosition) +
          '        noCompress += ["bundle"]\n' +
          buildGradle.slice(insertPosition)

        androidConfig.modResults.contents = newContent
      }
    } else {
      const androidBlock = buildGradle.indexOf('android {')
      if (androidBlock === -1) {
        throw new Error(`Cannot find android { block in build.gradle!`)
      }
      const insertPosition = buildGradle.indexOf('\n', androidBlock) + 1
      const newContent =
        buildGradle.slice(0, insertPosition) +
        '    androidResources {\n' +
        '        noCompress += ["bundle"]\n' +
        '    }\n' +
        buildGradle.slice(insertPosition)

      androidConfig.modResults.contents = newContent
    }

    return androidConfig
  })
}
