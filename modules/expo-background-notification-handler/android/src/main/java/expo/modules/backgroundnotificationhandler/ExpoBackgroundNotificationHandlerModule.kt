package expo.modules.backgroundnotificationhandler

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoBackgroundNotificationHandlerModule : Module() {
  companion object {
    var isForegrounded = false
  }

  override fun definition() = ModuleDefinition {
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

    AsyncFunction("getStringStoreAsync") { forKey: String ->
      return@AsyncFunction NotificationPrefs(appContext.reactContext).getStringStore(forKey)
    }

    AsyncFunction("setBoolAsync") { forKey: String, value: Boolean ->
      NotificationPrefs(appContext.reactContext).setBoolean(forKey, value)
    }

    AsyncFunction("setStringAsync") { forKey: String, value: String ->
      NotificationPrefs(appContext.reactContext).setString(forKey, value)
    }

    AsyncFunction("setStringStoreAsync") { forKey: String, value: Map<String, Boolean> ->
      NotificationPrefs(appContext.reactContext).setStringStore(forKey, value)
    }

    AsyncFunction("addToStringStoreAsync") { forKey: String, string: String ->
      NotificationPrefs(appContext.reactContext).addToStringStore(forKey, string)
    }

    AsyncFunction("removeFromStringStoreAsync") { forKey: String, string: String ->
      NotificationPrefs(appContext.reactContext).removeFromStringStore(forKey, string)
    }

    AsyncFunction("addManyToStringStoreAsync") { forKey: String, strings: Array<String> ->
      NotificationPrefs(appContext.reactContext).addManyToStringStore(forKey, strings)
    }

    AsyncFunction("removeManyFromStringStoreAsync") { forKey: String, strings: Array<String> ->
      NotificationPrefs(appContext.reactContext).removeManyFromStringStore(forKey, strings)
    }
  }
}
