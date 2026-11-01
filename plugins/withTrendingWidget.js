const {withDangerousMod, withXcodeProject} = require('expo/config-plugins')
const fs = require('fs')
const path = require('path')

const SOURCE_DIRECTORY = 'modules/TrendingTopicsWidget'
const ANDROID_WIDGET_INFO_FILE = 'trending_topics_widget_info.xml'
const ANDROID_PREVIEW_LAYOUT = '@layout/trending_topics_widget_preview'
const IOS_TARGET = 'ExpoWidgetsTarget'
const IOS_ASSET_CATALOG = 'WidgetAssets.xcassets'

/**
 * Native extras for the trending topics widget that expo-widgets has no
 * options for: a widget picker preview on Android, and an asset catalog (for
 * the butterfly) in the iOS widget extension.
 *
 * Both edit what expo-widgets generates, and mods run in reverse order of
 * registration, so this plugin must be listed before `expo-widgets`.
 */
module.exports = function withTrendingWidget(config) {
  config = withAndroidPreview(config)
  config = withIosAssetCatalog(config)
  return config
}

/**
 * Copies our preview resources into the project and adds
 * `android:previewLayout` to the widget info.
 */
function withAndroidPreview(config) {
  return withDangerousMod(config, [
    'android',
    config => {
      const resDirectory = path.join(
        config.modRequest.platformProjectRoot,
        'app/src/main/res',
      )
      fs.cpSync(
        path.join(
          config.modRequest.projectRoot,
          SOURCE_DIRECTORY,
          'android/res',
        ),
        resDirectory,
        {recursive: true},
      )

      const widgetInfoPath = path.join(
        resDirectory,
        'xml',
        ANDROID_WIDGET_INFO_FILE,
      )
      if (!fs.existsSync(widgetInfoPath)) {
        throw new Error(
          `withTrendingWidget: ${ANDROID_WIDGET_INFO_FILE} not found. Is this plugin listed before expo-widgets?`,
        )
      }
      const widgetInfo = fs.readFileSync(widgetInfoPath, 'utf8')
      if (!widgetInfo.includes('android:previewLayout')) {
        fs.writeFileSync(
          widgetInfoPath,
          widgetInfo.replace(
            '<appwidget-provider ',
            `<appwidget-provider android:previewLayout="${ANDROID_PREVIEW_LAYOUT}" `,
          ),
        )
      }
      return config
    },
  ])
}

/**
 * Copies our asset catalog into the widget extension and adds it to the
 * target's resources.
 */
function withIosAssetCatalog(config) {
  return withXcodeProject(config, config => {
    const project = config.modResults
    fs.cpSync(
      path.join(
        config.modRequest.projectRoot,
        SOURCE_DIRECTORY,
        'ios',
        IOS_ASSET_CATALOG,
      ),
      path.join(
        config.modRequest.platformProjectRoot,
        IOS_TARGET,
        IOS_ASSET_CATALOG,
      ),
      {recursive: true},
    )

    const targetKey = project.findTargetKey(IOS_TARGET)
    const groupKey = project.findPBXGroupKey({name: IOS_TARGET})
    if (!targetKey || !groupKey) {
      throw new Error(
        `withTrendingWidget: the ${IOS_TARGET} target was not found. Is this plugin listed before expo-widgets?`,
      )
    }

    // null if the catalog was already added by an earlier prebuild
    const file = project.addFile(IOS_ASSET_CATALOG, groupKey)
    if (!file) {
      return config
    }
    file.uuid = project.generateUuid()
    file.target = targetKey
    project.addToPbxBuildFileSection(file)
    /*
     * expo-widgets only gives the target a resources phase when the app has
     * locales. Check the target itself: `pbxResourcesBuildPhaseObj` falls back
     * to the main app's phase when the target has none.
     */
    if (!project.buildPhase('Resources', targetKey)) {
      project.addBuildPhase(
        [],
        'PBXResourcesBuildPhase',
        'Resources',
        targetKey,
      )
    }
    project.addToPbxResourcesBuildPhase(file)
    return config
  })
}
