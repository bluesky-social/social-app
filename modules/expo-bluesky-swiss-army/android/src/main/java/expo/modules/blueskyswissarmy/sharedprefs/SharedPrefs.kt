package expo.modules.blueskyswissarmy.sharedprefs

import android.content.Context
import android.content.SharedPreferences
import android.util.Log

val DEFAULTS =
  mapOf<String, Any>(
    "playSoundChat" to true,
    "playSoundFollow" to false,
    "playSoundLike" to false,
    "playSoundMention" to false,
    "playSoundQuote" to false,
    "playSoundReply" to false,
    "playSoundRepost" to false,
    "badgeCount" to 0,
  )

const val NAME = "SharedPrefs"

class SharedPrefs(
  private val context: Context,
) {
  companion object {
    private var hasInitialized = false

    private var instance: SharedPreferences? = null

    fun getInstance(
      context: Context,
      info: String? = "(no info)",
    ): SharedPreferences {
      if (instance == null) {
        Log.d(NAME, "No preferences instance found, creating one.")
        instance = context.getSharedPreferences("xyz.blueskyweb.app", Context.MODE_PRIVATE)
      }

      val safeInstance = instance ?: throw Error("Preferences is null: $info")

      if (!hasInitialized) {
        Log.d(NAME, "Preferences instance has not been initialized yet.")
        initialize(safeInstance)
        hasInitialized = true
        Log.d(NAME, "Preferences instance has been initialized.")
      }

      return safeInstance
    }

    private fun initialize(instance: SharedPreferences) {
      instance
        .edit()
        .apply {
          DEFAULTS.forEach { (key, value) ->
            if (instance.contains(key)) {
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
  }

  fun setValue(
    key: String,
    value: String,
  ) {
    val safeInstance = getInstance(context)
    safeInstance
      .edit()
      .apply {
        putString(key, value)
      }.apply()
  }

  fun setValue(
    key: String,
    value: Float,
  ) {
    val safeInstance = getInstance(context)
    safeInstance
      .edit()
      .apply {
        putFloat(key, value)
      }.apply()
  }

  fun setValue(
    key: String,
    value: Boolean,
  ) {
    val safeInstance = getInstance(context)
    safeInstance
      .edit()
      .apply {
        putBoolean(key, value)
      }.apply()
  }

  fun setValue(
    key: String,
    value: Set<String>,
  ) {
    val safeInstance = getInstance(context)
    safeInstance
      .edit()
      .apply {
        putStringSet(key, value)
      }.apply()
  }

  fun removeValue(key: String) {
    val safeInstance = getInstance(context)
    safeInstance
      .edit()
      .apply {
        remove(key)
      }.apply()
  }

  fun getString(key: String): String? {
    val safeInstance = getInstance(context)
    return safeInstance.getString(key, null)
  }

  fun getFloat(key: String): Float? {
    val safeInstance = getInstance(context)
    if (!safeInstance.contains(key)) {
      return null
    }
    return safeInstance.getFloat(key, 0.0f)
  }

  @Suppress("ktlint:standard:function-naming")
  fun _setAnyValue(
    key: String,
    value: Any,
  ) {
    val safeInstance = getInstance(context)
    safeInstance
      .edit()
      .apply {
        when (value) {
          is String -> putString(key, value)
          is Float -> putFloat(key, value)
          is Boolean -> putBoolean(key, value)
          is Set<*> -> putStringSet(key, value.map { it.toString() }.toSet())
          else -> throw Error("Unsupported type: ${value::class.java}")
        }
      }.apply()
  }

  fun getBoolean(key: String): Boolean? {
    val safeInstance = getInstance(context)
    if (!safeInstance.contains(key)) {
      return null
    }
    Log.d(NAME, "Getting boolean for key: $key")
    val res = safeInstance.getBoolean(key, false)
    Log.d(NAME, "Got boolean for key: $key, value: $res")
    return res
  }

  fun addToSet(
    key: String,
    value: String,
  ) {
    val safeInstance = getInstance(context)
    val set = safeInstance.getStringSet(key, setOf()) ?: setOf()
    val newSet =
      set.toMutableSet().apply {
        add(value)
      }
    safeInstance
      .edit()
      .apply {
        putStringSet(key, newSet)
      }.apply()
  }

  fun removeFromSet(
    key: String,
    value: String,
  ) {
    val safeInstance = getInstance(context)
    val set = safeInstance.getStringSet(key, setOf()) ?: setOf()
    val newSet =
      set.toMutableSet().apply {
        remove(value)
      }
    safeInstance
      .edit()
      .apply {
        putStringSet(key, newSet)
      }.apply()
  }

  fun setContains(
    key: String,
    value: String,
  ): Boolean {
    val safeInstance = getInstance(context)
    val set = safeInstance.getStringSet(key, setOf()) ?: setOf()
    return set.contains(value)
  }

  fun hasValue(key: String): Boolean {
    val safeInstance = getInstance(context)
    return safeInstance.contains(key)
  }

  fun getValues(keys: Set<String>): Map<String, Any?> {
    val safeInstance = getInstance(context)
    return keys.associateWith { key ->
      when (val value = safeInstance.all[key]) {
        is String -> value
        is Float -> value
        is Boolean -> value
        is Set<*> -> value
        else -> null
      }
    }
  }
}
