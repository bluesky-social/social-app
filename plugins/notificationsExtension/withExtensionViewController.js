const {withXcodeProject} = require('@expo/config-plugins')
const path = require('path')
const fs = require('fs')

const withExtensionViewController = (
  config,
  {controllerName, extensionName},
) => {
  // eslint-disable-next-line no-shadow
  return withXcodeProject(config, config => {
    const controllerPath = path.join(
      config.modRequest.projectRoot,
      'modules',
      extensionName,
      `${controllerName}.swift`,
    )

    const targetPath = path.join(
      config.modRequest.platformProjectRoot,
      extensionName,
      `${controllerName}.swift`,
    )

    fs.mkdirSync(path.dirname(targetPath), {recursive: true})
    fs.copyFileSync(controllerPath, targetPath)

    return config
  })
}

module.exports = {withExtensionViewController}
