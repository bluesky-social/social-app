package expo.modules.keyboardlanguage

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoKeyboardLanguageModule : Module() {
  override fun definition() =
    ModuleDefinition {
      Name("ExpoKeyboardLanguage")

      Function("getKeyboardLanguage") { _: Int ->
        return@Function null as String?
      }
    }
}
