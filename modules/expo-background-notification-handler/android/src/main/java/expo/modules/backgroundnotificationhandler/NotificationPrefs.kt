package expo.modules.backgroundnotificationhandler

import android.content.Context

class NotificationPrefs (private val context: Context?) {
  private val prefs = context?.getSharedPreferences("xyz.blueskyweb.app", Context.MODE_PRIVATE)
    ?: throw Error("Context is null")

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

  fun getAllPrefs(): MutableMap<String, *> {
    return prefs.all
  }

  fun getBoolean(key: String): Boolean {
    return prefs.getBoolean(key, false)
  }

  fun getString(key: String): String? {
    return prefs.getString(key, null)
  }

  fun getStringArray(key: String): Array<String>? {
    return prefs.getStringSet(key, null)?.toTypedArray()
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

  fun setStringArray(key: String, value: Array<String>) {
    prefs
      .edit()
      .apply {
        putStringSet(key, value.toSet())
      }
      .apply()
  }

  fun addToStringArray(key: String, string: String) {
    prefs
      .edit()
      .apply {
        val set = prefs.getStringSet(key, null)?.toMutableSet() ?: mutableSetOf()
        set.add(string)
        putStringSet(key, set)
      }
      .apply()
  }

  fun removeFromStringArray(key: String, string: String) {
    prefs
      .edit()
      .apply {
        val set = prefs.getStringSet(key, null)?.toMutableSet() ?: mutableSetOf()
        set.remove(string)
        putStringSet(key, set)
      }
      .apply()
  }

  fun addManyToStringArray(key: String, strings: Array<String>) {
    prefs
      .edit()
      .apply {
        val set = prefs.getStringSet(key, null)?.toMutableSet() ?: mutableSetOf()
        set.addAll(strings.toSet())
        putStringSet(key, set)
      }
      .apply()
  }

  fun removeManyFromStringArray(key: String, strings: Array<String>) {
    prefs
      .edit()
      .apply {
        val set = prefs.getStringSet(key, null)?.toMutableSet() ?: mutableSetOf()
        set.removeAll(strings.toSet())
        putStringSet(key, set)
      }
      .apply()
  }
}