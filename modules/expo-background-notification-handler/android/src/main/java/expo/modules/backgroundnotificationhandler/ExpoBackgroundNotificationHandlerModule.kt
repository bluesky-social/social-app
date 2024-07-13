package expo.modules.backgroundnotificationhandler

import android.content.Context
import expo.modules.blueskyswissarmy.sharedprefs.SharedPrefs
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

val DEFAULTS =
  mapOf<String, Any>(
    "playSoundChat" to true,
    "playSoundFollow" to false,
    "playSoundLike" to false,
    "playSoundMention" to false,
    "playSoundQuote" to false,
    "playSoundReply" to false,
    "playSoundRepost" to false,
    "mutedThreads" to mapOf<String, List<String>>(),
  )

enum class BadgeType(val rawValue: String) {
  Generic("badgeCountGeneric"),
  Messages("badgeCountMessages"),
}

const val INCREMENTED_FOR_KEY = "incremented-for-convos"

class ExpoBackgroundNotificationHandlerModule : Module() {
  companion object {
    var isForegrounded = false
  }

  fun getContext(): Context {
    return appContext.reactContext ?: throw Error("Context is null")
  }

  override fun definition() =
    ModuleDefinition {
      Name("ExpoBackgroundNotificationHandler")

      OnCreate {
        val context = appContext.reactContext ?: throw Error("Context is null")
        DEFAULTS.forEach { (key, value) ->
          if (SharedPrefs(context).hasValue(key)) {
            return@forEach
          }
          SharedPrefs(context)._setAnyValue(key, value)
        }
      }

      OnActivityEntersForeground {
        isForegrounded = true
      }

      OnActivityEntersBackground {
        isForegrounded = false
      }

      AsyncFunction("getPrefsAsync") {
        val keys = DEFAULTS.keys
        return@AsyncFunction SharedPrefs(getContext()).getValues(keys)
      }

      AsyncFunction("resetGenericCountAsync") {
        SharedPrefs(getContext()).setValue(BadgeType.Generic.rawValue, 0f)
      }

      AsyncFunction("maybeIncrementMessagesCountAsync") { convoId: String ->
        val prefs = SharedPrefs(getContext())
        if (!prefs.setContains(INCREMENTED_FOR_KEY, convoId)) {
          val curr = prefs.getFloat(BadgeType.Messages.rawValue) ?: 0f
          prefs.setValue(BadgeType.Messages.rawValue, curr + 1)
        }
      }

      AsyncFunction("maybeDecrementMessagesCountAsync") { convoId: String ->
        val prefs = SharedPrefs(getContext())
        if (prefs.setContains(INCREMENTED_FOR_KEY, convoId)) {
          val curr = prefs.getFloat(BadgeType.Messages.rawValue) ?: 0f
          if (curr != 0f) {
            prefs.setValue(BadgeType.Messages.rawValue, curr - 1)
          }
        }
      }
    }
}
