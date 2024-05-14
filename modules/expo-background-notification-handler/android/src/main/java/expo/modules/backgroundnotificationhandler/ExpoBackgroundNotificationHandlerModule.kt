package expo.modules.backgroundnotificationhandler

import android.content.Context
import android.content.SharedPreferences
import android.preference.PreferenceManager
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoBackgroundNotificationHandlerModule : Module() {
  companion object {
    var isForegrounded = false
  }

  override fun definition() = ModuleDefinition {
    Name("ExpoBackgroundNotificationHandler")

    AsyncFunction("getAllPrefsAsync") {
      return@AsyncFunction NotificationPrefs(appContext.reactContext).getAllPrefs()
    }

    AsyncFunction("getBoolAsync") { forKey: String ->
      return@AsyncFunction NotificationPrefs(appContext.reactContext).getBoolean(forKey)
    }

    AsyncFunction("getStringAsync") { forKey: String ->
      return@AsyncFunction NotificationPrefs(appContext.reactContext).getString(forKey)
    }

    AsyncFunction("setBoolAsync") { forKey: String, value: Boolean ->
      NotificationPrefs(appContext.reactContext).setBoolean(forKey, value)
    }

    AsyncFunction("setStringAsync") { forKey: String, value: String ->
      NotificationPrefs(appContext.reactContext).setString(forKey, value)
    }

    OnActivityEntersForeground {
      isForegrounded = true
    }

    OnActivityEntersBackground {
      isForegrounded = false
    }
  }
}
