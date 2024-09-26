const {withXcodeProject} = require('@expo/config-plugins')

const BUILD_PHASE_FILES = ['AppDelegate.swift', 'ViewController.swift']

const withXcodeTarget = (config, {targetName}) => {
  // eslint-disable-next-line no-shadow
  return withXcodeProject(config, config => {
    const pbxProject = config.modResults

    const target = pbxProject.addTarget(targetName, 'application', targetName)
    target.pbxNativeTarget.productType = `"com.apple.product-type.application.on-demand-install-capable"`
    pbxProject.addBuildPhase(
      BUILD_PHASE_FILES.map(f => `${targetName}/${f}`),
      'PBXSourcesBuildPhase',
      'Sources',
      target.uuid,
      'application',
      '"AppClips"',
    )
    pbxProject.addBuildPhase(
      [`${targetName}/Images.xcassets`],
      'PBXResourcesBuildPhase',
      'Resources',
      target.uuid,
      'application',
      '"AppClips"',
    )

    const pbxGroup = pbxProject.addPbxGroup([
      'AppDelegate.swift',
      'ViewController.swift',
      'Images.xcassets',
      `${targetName}.entitlements`,
      'Info.plist',
    ])

    pbxProject.addFile(`${targetName}/Info.plist`, pbxGroup.uuid)
    const configurations = pbxProject.pbxXCBuildConfigurationSection()
    for (const key in configurations) {
      if (typeof configurations[key].buildSettings !== 'undefined') {
        const buildSettingsObj = configurations[key].buildSettings
        if (
          typeof buildSettingsObj.PRODUCT_NAME !== 'undefined' &&
          buildSettingsObj.PRODUCT_NAME === `"${targetName}"`
        ) {
          buildSettingsObj.CLANG_ENABLE_MODULES = 'YES'
          buildSettingsObj.INFOPLIST_FILE = `"${targetName}/Info.plist"`
          buildSettingsObj.CODE_SIGN_ENTITLEMENTS = `"${targetName}/${targetName}.entitlements"`
          buildSettingsObj.CODE_SIGN_STYLE = 'Automatic'
          buildSettingsObj.CURRENT_PROJECT_VERSION = `"${
            process.env.BSKY_IOS_BUILD_NUMBER ?? '1'
          }"`
          buildSettingsObj.GENERATE_INFOPLIST_FILE = 'YES'
          buildSettingsObj.MARKETING_VERSION = `"${config.version}"`
          buildSettingsObj.PRODUCT_BUNDLE_IDENTIFIER = `"${config.ios?.bundleIdentifier}.AppClip"`
          buildSettingsObj.SWIFT_EMIT_LOC_STRINGS = 'YES'
          buildSettingsObj.SWIFT_VERSION = '5.0'
          buildSettingsObj.TARGETED_DEVICE_FAMILY = `"1"`
          buildSettingsObj.DEVELOPMENT_TEAM = 'B3LX46C5HS'
          buildSettingsObj.IPHONEOS_DEPLOYMENT_TARGET = '15.1'
          buildSettingsObj.ASSETCATALOG_COMPILER_APPICON_NAME = 'AppIcon'
        }
      }
    }

    pbxProject.addTargetAttribute('DevelopmentTeam', 'B3LX46C5HS', targetName)

    if (!pbxProject.hash.project.objects.PBXTargetDependency) {
      pbxProject.hash.project.objects.PBXTargetDependency = {}
    }
    if (!pbxProject.hash.project.objects.PBXContainerItemProxy) {
      pbxProject.hash.project.objects.PBXContainerItemProxy = {}
    }
    pbxProject.addTargetDependency(pbxProject.getFirstTarget().uuid, [
      target.uuid,
    ])

    pbxProject.addBuildPhase(
      [`${targetName}.app`],
      'PBXCopyFilesBuildPhase',
      'Embed App Clips',
      pbxProject.getFirstTarget().uuid,
      'application',
      '"AppClips"',
    )

    return config
  })
}

module.exports = {withXcodeTarget}
