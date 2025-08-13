package expo.community.modules.emojipicker

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.net.URL

class EmojiPickerModule : Module() {
  override fun definition() =
    ModuleDefinition {
      Name("EmojiPicker")

      View(EmojiPickerModuleView::class) {
        Events("onEmojiSelected")
      }
    }
}
