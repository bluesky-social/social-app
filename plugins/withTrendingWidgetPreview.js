const {withDangerousMod} = require('expo/config-plugins')
const fs = require('fs')
const path = require('path')

const WIDGET_INFO_FILE = 'trending_topics_widget_info.xml'
const PREVIEW_LAYOUT = '@layout/trending_topics_widget_preview'

/**
 * Gives the Android trending topics widget a preview in the widget picker,
 * which is otherwise blank. expo-widgets has no option for
 * `android:previewLayout`, so this copies our preview resources into the
 * project and adds the attribute to the widget info that expo-widgets writes.
 *
 * Dangerous mods run in reverse order of registration, so this plugin must be
 * listed before `expo-widgets` to run after it.
 */
module.exports = function withTrendingWidgetPreview(config) {
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
          'modules/TrendingTopicsWidget/android/res',
        ),
        resDirectory,
        {recursive: true},
      )

      const widgetInfoPath = path.join(resDirectory, 'xml', WIDGET_INFO_FILE)
      if (!fs.existsSync(widgetInfoPath)) {
        throw new Error(
          `withTrendingWidgetPreview: ${WIDGET_INFO_FILE} not found. Is this plugin listed before expo-widgets?`,
        )
      }
      const widgetInfo = fs.readFileSync(widgetInfoPath, 'utf8')
      if (!widgetInfo.includes('android:previewLayout')) {
        fs.writeFileSync(
          widgetInfoPath,
          widgetInfo.replace(
            '<appwidget-provider ',
            `<appwidget-provider android:previewLayout="${PREVIEW_LAYOUT}" `,
          ),
        )
      }
      return config
    },
  ])
}
