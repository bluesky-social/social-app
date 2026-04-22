package expo.modules.keyboardlanguage

import android.database.ContentObserver
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.view.inputmethod.InputMethodManager
import androidx.core.content.getSystemService
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoKeyboardLanguageModule : Module() {
  private var subtypeObserver: ContentObserver? = null
  private var lastLanguage: String? = null

  override fun definition() =
    ModuleDefinition {
      Name("ExpoKeyboardLanguage")

      Events("onKeyboardLanguageChange")

      Function("getCurrentKeyboardLanguage") {
        return@Function getCurrentLanguage()
      }

      OnStartObserving {
        val context = appContext.reactContext ?: return@OnStartObserving
        val uri = Settings.Secure.getUriFor("selected_input_method_subtype")

        subtypeObserver = object : ContentObserver(Handler(Looper.getMainLooper())) {
          override fun onChange(selfChange: Boolean) {
            val language = getCurrentLanguage()
            if (language != lastLanguage) {
              lastLanguage = language
              sendEvent("onKeyboardLanguageChange", mapOf("language" to language))
            }
          }
        }

        context.contentResolver.registerContentObserver(uri, false, subtypeObserver!!)
      }

      OnStopObserving {
        subtypeObserver?.let { observer ->
          appContext.reactContext?.contentResolver?.unregisterContentObserver(observer)
        }
        subtypeObserver = null
      }
    }

  private fun getCurrentLanguage(): String? {
    val context = appContext.reactContext ?: return null
    val imm = context.getSystemService<InputMethodManager>() ?: return null
    val subtype = imm.currentInputMethodSubtype ?: return null

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
      val tag = subtype.languageTag
      if (tag.isNotEmpty()) return tag
    }

    @Suppress("DEPRECATION")
    val locale = subtype.locale
    if (locale.isNotEmpty()) return locale

    return null
  }
}
