package expo.modules.backgroundnotificationhandler

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoBackgroundNotificationHandlerModule : Module() {
  companion object {
    var isForegrounded = false
  }

  override fun definition() = ModuleDefinition {
    Name("ExpoBackgroundNotificationHandler")

    OnActivityEntersForeground {
      isForegrounded = true
    }

    OnActivityEntersBackground {
      isForegrounded = false
    }
  }
}
