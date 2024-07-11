package expo.modules.blueskyswissarmy.visibilityview

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoBlueskyVisibilityViewModule : Module() {
  override fun definition() =
    ModuleDefinition {
      Name("ExpoBlueskyVisibilityView")

      View(VisibilityView::class) {
        Events(arrayOf("onVisibleChange"))

        Prop("enabled") { view: VisibilityView, prop: Boolean ->
          view._enabled = prop
        }
      }
    }
}
