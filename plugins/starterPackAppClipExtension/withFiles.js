const {withXcodeProject} = require('@expo/config-plugins')
const path = require('path')
const fs = require('fs')

const FILES = ['AppDelegate.swift', 'ViewController.swift']

const withFiles = (config, {targetName}) => {
  // eslint-disable-next-line no-shadow
  return withXcodeProject(config, config => {
    const basePath = path.join(
      config.modRequest.projectRoot,
      'modules',
      targetName,
    )

    for (const file of FILES) {
      const sourcePath = path.join(basePath, file)
      const targetPath = path.join(
        config.modRequest.platformProjectRoot,
        targetName,
        file,
      )

      fs.mkdirSync(path.dirname(targetPath), {recursive: true})
      fs.copyFileSync(sourcePath, targetPath)
    }

    const imagesBasePath = path.join(basePath, 'Images.xcassets')
    const imagesTargetPath = path.join(
      config.modRequest.platformProjectRoot,
      targetName,
      'Images.xcassets',
    )
    fs.cpSync(imagesBasePath, imagesTargetPath, {recursive: true})

    return config
  })
}

module.exports = {withFiles}
