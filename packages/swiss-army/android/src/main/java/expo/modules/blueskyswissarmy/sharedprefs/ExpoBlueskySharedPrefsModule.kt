package expo.modules.blueskyswissarmy.sharedprefs

import android.content.Context
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

      // Mirrors iOS, where `JavaScriptValue` can't be a `Function` argument
      // since SDK 58.
      Function("setNumber") { key: String, value: Float ->
        return@Function SharedPrefs(getContext()).setValue(key, value)
      }

      Function("setBool") { key: String, value: Boolean ->
        return@Function SharedPrefs(getContext()).setValue(key, value)
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
