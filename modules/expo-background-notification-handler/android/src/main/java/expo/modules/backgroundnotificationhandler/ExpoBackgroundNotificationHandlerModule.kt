package expo.modules.backgroundnotificationhandler

import expo.modules.blueskyswissarmy.sharedprefs.Preferences
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

val DEFAULTS = mapOf<String, Any>(
  "playSoundChat" to true,
  "playSoundFollow" to false,
  "playSoundLike" to false,
  "playSoundMention" to false,
  "playSoundQuote" to false,
  "playSoundReply" to false,
  "playSoundRepost" to false,
  "mutedThreads" to mapOf<String, List<String>>()
)

class ExpoBackgroundNotificationHandlerModule : Module() {
  companion object {
    var isForegrounded = false
  }

  override fun definition() =
    ModuleDefinition {
      Name("ExpoBackgroundNotificationHandler")

    OnCreate {
      val context = appContext.reactContext ?: throw Error("Context is null")
      DEFAULTS.forEach { (key, value) ->
        if (Preferences(context).hasValue(key)) {
          return@forEach
        }
        Preferences(context)._setAnyValue(key, value)
      }
    }

      OnActivityEntersForeground {
        isForegrounded = true
      }

      OnActivityEntersBackground {
        isForegrounded = false
      }

    AsyncFunction("getPrefsAsync") {
      val context = appContext.reactContext ?: throw Error("Context is null")
      val keys = DEFAULTS.keys
      return@AsyncFunction Preferences(context).getValues(keys)
    }

    AsyncFunction("resetGenericCountAsync") {
      // Not implemented
    }

    AsyncFunction("maybeIncrementMessagesCountAsync") {
      // Not implemented
    }

    AsyncFunction("maybeDecrementMessagesCountAsync") {
      // Not implemented
    }
  }
}
