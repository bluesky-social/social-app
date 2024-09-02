const {withXcodeProject, IOSConfig} = require('@expo/config-plugins')
const path = require('path')
const PBXFile = require('xcode/lib/pbxFile')

const withXcodeTarget = (
  config,
  {extensionName, controllerName, soundFiles},
) => {
  // eslint-disable-next-line no-shadow
  return withXcodeProject(config, config => {
    let pbxProject = config.modResults

    const target = pbxProject.addTarget(
      extensionName,
      'app_extension',
      extensionName,
    )
    pbxProject.addBuildPhase([], 'PBXSourcesBuildPhase', 'Sources', target.uuid)
    pbxProject.addBuildPhase(
      [],
      'PBXResourcesBuildPhase',
      'Resources',
      target.uuid,
    )
    const pbxGroupKey = pbxProject.pbxCreateGroup(extensionName, extensionName)
    pbxProject.addFile(`${extensionName}/Info.plist`, pbxGroupKey)
    pbxProject.addSourceFile(
      `${extensionName}/${controllerName}.swift`,
      {target: target.uuid},
      pbxGroupKey,
    )

    for (const file of soundFiles) {
      pbxProject.addSourceFile(
        `${extensionName}/${file}`,
        {target: target.uuid},
        pbxGroupKey,
      )
    }

    var configurations = pbxProject.pbxXCBuildConfigurationSection()
    for (var key in configurations) {
      if (typeof configurations[key].buildSettings !== 'undefined') {
        var buildSettingsObj = configurations[key].buildSettings
        if (
          typeof buildSettingsObj.PRODUCT_NAME !== 'undefined' &&
          buildSettingsObj.PRODUCT_NAME === `"${extensionName}"`
        ) {
          buildSettingsObj.CLANG_ENABLE_MODULES = 'YES'
          buildSettingsObj.INFOPLIST_FILE = `"${extensionName}/Info.plist"`
          buildSettingsObj.CODE_SIGN_ENTITLEMENTS = `"${extensionName}/${extensionName}.entitlements"`
          buildSettingsObj.CODE_SIGN_STYLE = 'Automatic'
          buildSettingsObj.CURRENT_PROJECT_VERSION = `"${config.ios?.buildNumber}"`
          buildSettingsObj.GENERATE_INFOPLIST_FILE = 'YES'
          buildSettingsObj.MARKETING_VERSION = `"${config.version}"`
          buildSettingsObj.PRODUCT_BUNDLE_IDENTIFIER = `"${config.ios?.bundleIdentifier}.${extensionName}"`
          buildSettingsObj.SWIFT_EMIT_LOC_STRINGS = 'YES'
          buildSettingsObj.SWIFT_VERSION = '5.0'
          buildSettingsObj.TARGETED_DEVICE_FAMILY = `"1,2"`
          buildSettingsObj.DEVELOPMENT_TEAM = 'B3LX46C5HS'
        }
      }
    }

    pbxProject.addTargetAttribute(
      'DevelopmentTeam',
      'B3LX46C5HS',
      extensionName,
    )
    pbxProject.addTargetAttribute('DevelopmentTeam', 'B3LX46C5HS')

    return config
  })
}

module.exports = {withXcodeTarget}
