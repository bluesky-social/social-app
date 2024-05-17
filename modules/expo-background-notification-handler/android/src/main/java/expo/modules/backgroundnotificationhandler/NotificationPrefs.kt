package expo.modules.backgroundnotificationhandler

import android.content.Context
import org.json.JSONObject

val DEFAULTS = mapOf(
  "playSoundChat" to true,
  "playSoundFollow" to false,
  "playSoundLike" to false,
  "playSoundMention" to false,
  "playSoundQuote" to false,
  "playSoundReply" to false,
  "playSoundRepost" to false,
  "threadMutes" to mapOf<String, Boolean>(),
  "disabledDids" to mapOf<String, Boolean>(),
)

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
            is Map<*, *> -> {
              putString(key, mapToString(value))
            }
            else -> {
              throw Error("Unsupported type")
            }
          }
        }
      }
      .apply()
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

  fun getStringStore(key: String): Map<String, Boolean>? {
    val value = prefs.getString(key, null) ?: return null
    return stringToMap(value)
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
        putString(key, mapToString(value))
      }
      .apply()
  }

  fun addToStringStore(key: String, string: String) {
    prefs
      .edit()
      .apply {
        val map = stringToMap(prefs.getString(key, null) ?: "{}").toMutableMap()
        map[string] = true
        putString(key, mapToString(map))
      }
      .apply()
  }

  fun removeFromStringStore(key: String, string: String) {
    prefs
      .edit()
      .apply {
        val map = stringToMap(prefs.getString(key, null) ?: "{}").toMutableMap()
        map.remove(string)
        putString(key, mapToString(map))
      }
      .apply()
  }

  fun addManyToStringStore(key: String, strings: Array<String>) {
    prefs
      .edit()
      .apply {
        val map = stringToMap(prefs.getString(key, null) ?: "{}").toMutableMap()
        strings.forEach {
          map[it] = true
        }
        putString(key, mapToString(map))
      }
      .apply()
  }

  fun removeManyFromStringStore(key: String, strings: Array<String>) {
    prefs
      .edit()
      .apply {
        val map = stringToMap(prefs.getString(key, null) ?: "{}").toMutableMap()
        strings.forEach {
          map.remove(it)
        }
        putString(key, mapToString(map))
      }
      .apply()
  }

  private fun mapToString(map: Any): String {
    return map.toString()
  }

  private fun stringToMap(string: String): Map<String, Boolean> {
    val jsonObject = JSONObject(string)
    return jsonObject.keys().asSequence().associateWith {
      jsonObject.getBoolean(it)
    }
  }
}