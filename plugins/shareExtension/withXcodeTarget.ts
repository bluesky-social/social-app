import {ConfigPlugin, withXcodeProject} from '@expo/config-plugins'
import * as fs from 'fs'
import * as path from 'path'

interface Params {
  extensionName: string
  controllerName: string
}

export const withXcodeTarget: ConfigPlugin<Params> = (
  config,
  {extensionName, controllerName},
) => {
  return withXcodeProject(config, config => {
    const extensionsPath = path.join(
      config.modRequest.projectRoot,
      'extensions',
      extensionName,
    )
    const targetPath = path.join(
      config.modRequest.platformProjectRoot,
      extensionName,
    )

    const proj = config.modResults

    if (proj.getFirstProject().firstProject.targets?.length > 1) return true
    const targetUuid = proj.generateUuid()
    const groupName = 'Embed Share Extensions'

    const commonBuildSettings: any = {
      ASSETCATALOG_COMPILER_APPICON_NAME: 'AppIcon',
      CLANG_ENABLE_MODULES: 'YES',
      CODE_SIGN_ENTITLEMENTS: `../${extensionName}/${extensionName}.entitlements`,
      CURRENT_PROJECT_VERSION: `"${config.ios?.buildNumber}"`,
      INFOPLIST_FILE: `../${extensionName}/Info.plist`,
      MARKETING_VERSION: `"${config.version}"`,
      PRODUCT_BUNDLE_IDENTIFIER: `${config.ios?.bundleIdentifier}.${extensionName}`,
      PRODUCT_NAME: extensionName,
      TARGETED_DEVICE_FAMILY: '"1,2"',
      SWIFT_VERSION: '5.0',
      IPHONEOS_DEPLOYMENT_TARGET: '13.4.1',
      VERSIONING_SYSTEM: 'apple-generic',
    }

    const buildConfigurationsList = [
      {
        name: 'Debug',
        isa: 'XCBuildConfiguration',
        buildSettings: {
          ...commonBuildSettings,
        },
      },
      {
        name: 'Release',
        isa: 'XCBuildConfiguration',
        buildSettings: {
          ...commonBuildSettings,
        },
      },
    ]
    const xCConfigurationList = proj.addXCConfigurationList(
      buildConfigurationsList,
      'Release',
      `Build configuration list for PBXNativeTarget "${extensionName}" `,
    )

    const productFile = {
      basename: `${extensionName}.appex`,
      fileRef: proj.generateUuid(),
      uuid: proj.generateUuid(),
      groupName: groupName,
      explicitFileType: 'wrapper.application',
      settings: {
        ATTRIBUTES: ['RemoveHeadersOnCopy'],
      },
      includeIndex: 0,
      path: `${extensionName}.appex`,
      sourceTree: 'BUILD_PRODUCTS_DIR',
    }

    proj.addToPbxFileReferenceSection(productFile)
    proj.addToPbxBuildFileSection(productFile)

    const target = {
      uuid: targetUuid,
      pbxNativeTarget: {
        isa: 'PBXNativeTarget',
        name: extensionName,
        productName: extensionName,
        productReference: productFile.fileRef,
        productType: `"com.apple.product-type.app-extension"`,
        buildConfigurationList: xCConfigurationList.uuid,
        buildPhases: [],
        buildRules: [],
        dependencies: [],
      },
    }
    proj.addToPbxNativeTargetSection(target)

    proj.addToPbxProjectSection(target)
    // Add target attributes to project section
    if (
      !proj.pbxProjectSection()[proj.getFirstProject().uuid].attributes
        .TargetAttributes
    ) {
      proj.pbxProjectSection()[
        proj.getFirstProject().uuid
      ].attributes.TargetAttributes = {}
    }
    proj.pbxProjectSection()[
      proj.getFirstProject().uuid
    ].attributes.TargetAttributes[target.uuid] = {
      CreatedOnToolsVersion: '13.4.1',
    }

    if (!proj.hash.project.objects.PBXTargetDependency) {
      proj.hash.project.objects.PBXTargetDependency = {}
    }
    if (!proj.hash.project.objects.PBXContainerItemProxy) {
      proj.hash.project.objects.PBXContainerItemProxy = {}
    }

    proj.addTargetDependency(proj.getFirstTarget().uuid, [target.uuid])

    const buildPath = `""`

    // Sources build phase
    const {uuid: sourcesBuildPhaseUuid} = proj.addBuildPhase(
      [`${extensionName}.swift`],
      'PBXSourcesBuildPhase',
      groupName,
      targetUuid,
      'app_extension',
      buildPath,
    )

    // Copy files build phase
    const {uuid: copyFilesBuildPhaseUuid} = proj.addBuildPhase(
      [productFile.path],
      'PBXCopyFilesBuildPhase',
      groupName,
      proj.getFirstTarget().uuid,
      'app_extension',
      buildPath,
    )

    // Frameworks build phase
    const {uuid: frameworksBuildPhaseUuid} = proj.addBuildPhase(
      [],
      'PBXFrameworksBuildPhase',
      groupName,
      targetUuid,
      'app_extension',
      buildPath,
    )

    // Add PBX group
    const {uuid: pbxGroupUuid} = proj.addPbxGroup(
      ['Info.plist', `${extensionName}.swift`],
      extensionName,
      `../${extensionName}`,
    )

    // Add PBXGroup to top level group
    const groups = proj.hash.project.objects.PBXGroup
    if (pbxGroupUuid) {
      Object.keys(groups).forEach(function (key) {
        if (groups[key].name === undefined && groups[key].path === undefined) {
          proj.addToPbxGroup(pbxGroupUuid, key)
        }
      })
    }

    return config
  })
}
