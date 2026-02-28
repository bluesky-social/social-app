package expo.modules.keyboardlanguage

import android.os.Build
import android.view.inputmethod.InputMethodManager
import androidx.core.content.getSystemService
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoKeyboardLanguageModule : Module() {
  override fun definition() =
    ModuleDefinition {
      Name("ExpoKeyboardLanguage")

      Function("getCurrentKeyboardLanguage") {
        val context = appContext.reactContext ?: return@Function null
        val imm = context.getSystemService<InputMethodManager>() ?: return@Function null
        val subtype = imm.currentInputMethodSubtype ?: return@Function null

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
          val tag = subtype.languageTag
          if (tag.isNotEmpty()) return@Function tag
        }

        @Suppress("DEPRECATION")
        val locale = subtype.locale
        if (locale.isNotEmpty()) return@Function locale

        return@Function null
      }
    }
}
