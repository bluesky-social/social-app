const {withXcodeProject} = require('@expo/config-plugins')
const path = require('path')
const fs = require('fs')

const withSounds = (config, {extensionName, soundFiles}) => {
  // eslint-disable-next-line no-shadow
  return withXcodeProject(config, config => {
    for (const file of soundFiles) {
      const soundPath = path.join(config.modRequest.projectRoot, 'assets', file)

      const targetPath = path.join(
        config.modRequest.platformProjectRoot,
        extensionName,
        file,
      )

      if (!fs.existsSync(path.dirname(targetPath))) {
        fs.mkdirSync(path.dirname(targetPath), {recursive: true})
      }
      fs.copyFileSync(soundPath, targetPath)
    }

    return config
  })
}

module.exports = {withSounds}
