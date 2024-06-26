package expo.modules.blueskyswissarmy.sharedprefs

import android.content.Context
import android.util.Log
import expo.modules.kotlin.Promise
import expo.modules.kotlin.jni.JavaScriptValue
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoBlueskySharedPrefsModule : Module() {
  private fun getContext(): Context {
    val context = appContext.reactContext ?: throw Error("Context is null")
    return context
  }

  override fun definition() = ModuleDefinition {
    Name("ExpoBlueskySharedPrefs")

    AsyncFunction("setStringAsync") { key: String, value: String ->
      return@AsyncFunction Preferences(getContext()).setValue(key, value)
    }

    AsyncFunction("setValueAsync") { key: String, value: JavaScriptValue, promise: Promise ->
      val context = getContext()
      try {
        if (value.isNumber()) {
          Preferences(context).setValue(key, value.getFloat())
          promise.resolve()
        } else if (value.isBool()) {
          Preferences(context).setValue(key, value.getBool())
          promise.resolve()
        } else if (value.isNull() || value.isUndefined()) {
          Preferences(context).removeValue(key)
          promise.resolve()
        } else {
          Log.d(NAME, "Unsupported type: ${value.kind()}")
          promise.reject("UNSUPPORTED_TYPE_ERROR", "Attempted to set an unsupported type", null)
        }
      } catch (e: Error) {
        Log.d(NAME, "Error setting value: $e")
        promise.reject("SET_VALUE_ERROR", "Error setting value", e)
      }
    }

    AsyncFunction("removeValueAsync") { key: String ->
      return@AsyncFunction Preferences(getContext()).removeValue(key)
    }

    AsyncFunction("getStringAsync") { key: String ->
      return@AsyncFunction Preferences(getContext()).getString(key)
    }

    AsyncFunction("getNumberAsync") { key: String ->
      return@AsyncFunction Preferences(getContext()).getFloat(key)
    }

    AsyncFunction("getBoolAsync") { key: String ->
      return@AsyncFunction Preferences(getContext()).getBoolean(key)
    }

    AsyncFunction("addToSetAsync") { key: String, value: String ->
      return@AsyncFunction Preferences(getContext()).addToSet(key, value)
    }

    AsyncFunction("removeFromSetAsync") { key: String, value: String ->
      return@AsyncFunction Preferences(getContext()).removeFromSet(key, value)
    }

    AsyncFunction("setContainsAsync") { key: String, value: String ->
      return@AsyncFunction Preferences(getContext()).setContains(key, value)
    }
  }
}
