package expo.modules.backgroundnotificationhandler

import android.content.Context

class NotificationPrefs (private val context: Context?) {
  private val prefs = context?.getSharedPreferences("xyz.blueskyweb.app", Context.MODE_PRIVATE) ?: throw Error("Context is null")

  init {
    if (!prefs.getBoolean("initialized", false)) {
      prefs
        .edit()
        .apply {
          putBoolean("initialized", true)
          putBoolean("playSoundChat", true)
          putBoolean("playSoundOther", false)
        }
        .apply()
    }
  }

  fun setBoolean(key: String, value: Boolean) {
    prefs
      .edit()
      .apply {
        putBoolean(key, value)
      }
      .apply()
  }

  fun setString(key: String, value: String) {
    prefs
      .edit()
      .apply {
        putString(key, value)
      }
      .apply()
  }

  fun getBoolean(key: String): Boolean {
    return prefs.getBoolean(key, false)
  }

  fun getString(key: String): String? {
    return prefs.getString(key, null)
  }

  fun getAllPrefs(): MutableMap<String, *> {
    return prefs.all
  }
}