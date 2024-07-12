package expo.modules.backgroundnotificationhandler

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoBackgroundNotificationHandlerModule : Module() {
  companion object {
    var isForegrounded = false
  }

  override fun definition() =
    ModuleDefinition {
      Name("ExpoBackgroundNotificationHandler")

      OnCreate {
        NotificationPrefs(appContext.reactContext).initialize()
      }

      OnActivityEntersForeground {
        isForegrounded = true
      }

      OnActivityEntersBackground {
        isForegrounded = false
      }

      AsyncFunction("getAllPrefsAsync") {
        return@AsyncFunction NotificationPrefs(appContext.reactContext).getAllPrefs()
      }

      AsyncFunction("getBoolAsync") { forKey: String ->
        return@AsyncFunction NotificationPrefs(appContext.reactContext).getBoolean(forKey)
      }

      AsyncFunction("getStringAsync") { forKey: String ->
        return@AsyncFunction NotificationPrefs(appContext.reactContext).getString(forKey)
      }

      AsyncFunction("getStringArrayAsync") { forKey: String ->
        return@AsyncFunction NotificationPrefs(appContext.reactContext).getStringArray(forKey)
      }

      AsyncFunction("setBoolAsync") { forKey: String, value: Boolean ->
        NotificationPrefs(appContext.reactContext).setBoolean(forKey, value)
      }

      AsyncFunction("setStringAsync") { forKey: String, value: String ->
        NotificationPrefs(appContext.reactContext).setString(forKey, value)
      }

      AsyncFunction("setStringArrayAsync") { forKey: String, value: Array<String> ->
        NotificationPrefs(appContext.reactContext).setStringArray(forKey, value)
      }

      AsyncFunction("addToStringArrayAsync") { forKey: String, string: String ->
        NotificationPrefs(appContext.reactContext).addToStringArray(forKey, string)
      }

      AsyncFunction("removeFromStringArrayAsync") { forKey: String, string: String ->
        NotificationPrefs(appContext.reactContext).removeFromStringArray(forKey, string)
      }

      AsyncFunction("addManyToStringArrayAsync") { forKey: String, strings: Array<String> ->
        NotificationPrefs(appContext.reactContext).addManyToStringArray(forKey, strings)
      }

      AsyncFunction("removeManyFromStringArrayAsync") { forKey: String, strings: Array<String> ->
        NotificationPrefs(appContext.reactContext).removeManyFromStringArray(forKey, strings)
      }

      AsyncFunction("setBadgeCountAsync") { _: Int ->
        // This does nothing on Android
      }
    }
}
