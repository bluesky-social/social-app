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
    }

    OnActivityEntersForeground {
      isForegrounded = true
    }

    OnActivityEntersBackground {
      isForegrounded = false
    }
  }
}
