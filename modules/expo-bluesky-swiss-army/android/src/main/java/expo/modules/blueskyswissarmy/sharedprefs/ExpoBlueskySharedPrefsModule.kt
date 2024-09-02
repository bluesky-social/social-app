package expo.modules.blueskyswissarmy.sharedprefs

import android.content.Context
import android.util.Log
import expo.modules.kotlin.jni.JavaScriptValue
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoBlueskySharedPrefsModule : Module() {
  private fun getContext(): Context {
    val context = appContext.reactContext ?: throw Error("Context is null")
    return context
  }

  override fun definition() =
    ModuleDefinition {
      Name("ExpoBlueskySharedPrefs")

      Function("setString") { key: String, value: String ->
        return@Function SharedPrefs(getContext()).setValue(key, value)
      }

      Function("setValue") { key: String, value: JavaScriptValue ->
        val context = getContext()
        Log.d("ExpoBlueskySharedPrefs", "Setting value for key: $key")
        try {
          if (value.isNumber()) {
            SharedPrefs(context).setValue(key, value.getFloat())
          } else if (value.isBool()) {
            SharedPrefs(context).setValue(key, value.getBool())
          } else if (value.isNull() || value.isUndefined()) {
            SharedPrefs(context).removeValue(key)
          } else {
            Log.d(NAME, "Unsupported type: ${value.kind()}")
          }
        } catch (e: Error) {
          Log.d(NAME, "Error setting value: $e")
        }
      }

      Function("removeValue") { key: String ->
        return@Function SharedPrefs(getContext()).removeValue(key)
      }

      Function("getString") { key: String ->
        return@Function SharedPrefs(getContext()).getString(key)
      }

      Function("getNumber") { key: String ->
        return@Function SharedPrefs(getContext()).getFloat(key)
      }

      Function("getBool") { key: String ->
        return@Function SharedPrefs(getContext()).getBoolean(key)
      }

      Function("addToSet") { key: String, value: String ->
        return@Function SharedPrefs(getContext()).addToSet(key, value)
      }

      Function("removeFromSet") { key: String, value: String ->
        return@Function SharedPrefs(getContext()).removeFromSet(key, value)
      }

      Function("setContains") { key: String, value: String ->
        return@Function SharedPrefs(getContext()).setContains(key, value)
      }
    }
}
