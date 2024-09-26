package expo.modules.backgroundnotificationhandler

import android.content.Context

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

class NotificationPrefs(
  private val context: Context?,
) {
  private val prefs =
    context?.getSharedPreferences("xyz.blueskyweb.app", Context.MODE_PRIVATE)
      ?: throw Error("Context is null")

  fun initialize() {
    prefs
      .edit()
      .apply {
        DEFAULTS.forEach { (key, value) ->
          if (prefs.contains(key)) {
            return@forEach
          }

          when (value) {
            is Boolean -> {
              putBoolean(key, value)
            }
            is String -> {
              putString(key, value)
            }
            is Array<*> -> {
              putStringSet(key, value.map { it.toString() }.toSet())
            }
            is Map<*, *> -> {
              putStringSet(key, value.map { it.toString() }.toSet())
            }
          }
        }
      }.apply()
  }

  fun getAllPrefs(): MutableMap<String, *> = prefs.all

  fun getBoolean(key: String): Boolean = prefs.getBoolean(key, false)

  fun getString(key: String): String? = prefs.getString(key, null)

  fun getStringArray(key: String): Array<String>? = prefs.getStringSet(key, null)?.toTypedArray()

  fun setBoolean(
    key: String,
    value: Boolean,
  ) {
    prefs
      .edit()
      .apply {
        putBoolean(key, value)
      }.apply()
  }

  fun setString(
    key: String,
    value: String,
  ) {
    prefs
      .edit()
      .apply {
        putString(key, value)
      }.apply()
  }

  fun setStringArray(
    key: String,
    value: Array<String>,
  ) {
    prefs
      .edit()
      .apply {
        putStringSet(key, value.toSet())
      }.apply()
  }

  fun addToStringArray(
    key: String,
    string: String,
  ) {
    prefs
      .edit()
      .apply {
        val set = prefs.getStringSet(key, null)?.toMutableSet() ?: mutableSetOf()
        set.add(string)
        putStringSet(key, set)
      }.apply()
  }

  fun removeFromStringArray(
    key: String,
    string: String,
  ) {
    prefs
      .edit()
      .apply {
        val set = prefs.getStringSet(key, null)?.toMutableSet() ?: mutableSetOf()
        set.remove(string)
        putStringSet(key, set)
      }.apply()
  }

  fun addManyToStringArray(
    key: String,
    strings: Array<String>,
  ) {
    prefs
      .edit()
      .apply {
        val set = prefs.getStringSet(key, null)?.toMutableSet() ?: mutableSetOf()
        set.addAll(strings.toSet())
        putStringSet(key, set)
      }.apply()
  }

  fun removeManyFromStringArray(
    key: String,
    strings: Array<String>,
  ) {
    prefs
      .edit()
      .apply {
        val set = prefs.getStringSet(key, null)?.toMutableSet() ?: mutableSetOf()
        set.removeAll(strings.toSet())
        putStringSet(key, set)
      }.apply()
  }
}
