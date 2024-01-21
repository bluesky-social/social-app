import {ConfigPlugin, withXcodeProject} from '@expo/config-plugins'
import * as path from 'path'
import * as fs from 'fs'

interface Params {
  extensionName: string
  controllerName: string
}

export const withExtensionViewController: ConfigPlugin<Params> = (
  config,
  {controllerName, extensionName},
) => {
  return withXcodeProject(config, config => {
    const controllerPath = path.join(
      config.modRequest.projectRoot,
      'extensions',
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
