package expo.modules.backgroundnotificationhandler

import android.content.Context

val DEFAULTS = mapOf(
  "playSoundChat" to true,
  "playSoundFollow" to false,
  "playSoundLike" to false,
  "playSoundMention" to false,
  "playSoundQuote" to false,
  "playSoundReply" to false,
  "playSoundRepost" to false,
  "threadMutes" to setOf<String>(),
  "disabledDids" to setOf<String>(),
)

val BOOL_VALS = arrayOf("playSoundChat", "playSoundFollow", "playSoundLike", "playSoundMention", "playSoundQuote", "playSoundReply", "playSoundRepost")
val MAP_VALS = arrayOf("threadMutes", "disabledDids")

class NotificationPrefs (private val context: Context?) {
  private val prefs = context?.getSharedPreferences("xyz.blueskyweb.app", Context.MODE_PRIVATE)
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
            is Set<*> -> {
              putStringSet(key, value as Set<String>)
            }
            else -> {
              throw Error("Unsupported type")
            }
          }
        }
      }
      .apply()
  }

  fun getAllPrefs(): MutableMap<String, Any> {
    val map = mutableMapOf<String, Any>()

    BOOL_VALS.forEach { key ->
      prefs.getBoolean(key, false).let { map[key] = it }
    }
    MAP_VALS.forEach { key ->
      prefs.getStringSet(key, setOf()).let { map[key] = stringSetToMap(it) }
    }

    return map
  }

  fun getBoolean(key: String): Boolean {
    return prefs.getBoolean(key, false)
  }

  fun getString(key: String): String? {
    return prefs.getString(key, null)
  }

  fun getStringStore(key: String): Map<String, Boolean>? {
    val value = prefs.getStringSet(key, null) ?: return null
    return stringSetToMap(value)
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

  fun setStringStore(key: String, value: Map<String, Boolean>) {
    prefs
      .edit()
      .apply {
        putStringSet(key, mapToStringSet(value))
      }
      .apply()
  }

  fun addToStringStore(key: String, string: String) {
    prefs
      .edit()
      .apply {
        val map = stringSetToMap(prefs.getStringSet(key, setOf())).toMutableMap()
        map[string] = true
        putStringSet(key, mapToStringSet(map))
      }
      .apply()
  }

  fun removeFromStringStore(key: String, string: String) {
    prefs
      .edit()
      .apply {
        val map = stringSetToMap(prefs.getStringSet(key, setOf())).toMutableMap()
        map.remove(string)
        putStringSet(key, mapToStringSet(map))
      }
      .apply()
  }

  fun addManyToStringStore(key: String, strings: Array<String>) {
    prefs
      .edit()
      .apply {
        val map = stringSetToMap(prefs.getStringSet(key, setOf())).toMutableMap()
        strings.forEach {
          map[it] = true
        }
        putStringSet(key, mapToStringSet(map))
      }
      .apply()
  }

  fun removeManyFromStringStore(key: String, strings: Array<String>) {
    prefs
      .edit()
      .apply {
        val map = stringSetToMap(prefs.getStringSet(key, setOf())).toMutableMap()
        strings.forEach {
          map.remove(it)
        }
        putStringSet(key, mapToStringSet(map))
      }
      .apply()
  }

  private fun mapToStringSet(map: Map<String, Boolean>): Set<String> {
    // Only if the value is true
    return map.filterValues { it }.keys
  }

  private fun stringSetToMap(set: MutableSet<String>?): Map<String, Boolean> {
    if (set == null) {
      return mapOf()
    }
    return set.associateWith { true }
  }
}
