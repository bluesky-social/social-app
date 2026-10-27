package expo.modules.blueskyswissarmy.widgetinfo

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoBlueskyWidgetInfoModule : Module() {
  override fun definition() =
    ModuleDefinition {
      Name("ExpoBlueskyWidgetInfo")

      AsyncFunction("isInstalled") { kind: String ->
        val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
        // expo-widgets generates a provider named `<package>.<widget name>Provider`
        val provider = ComponentName(context.packageName, "${context.packageName}.${kind}Provider")
        AppWidgetManager.getInstance(context).getAppWidgetIds(provider).isNotEmpty()
      }
    }
}
