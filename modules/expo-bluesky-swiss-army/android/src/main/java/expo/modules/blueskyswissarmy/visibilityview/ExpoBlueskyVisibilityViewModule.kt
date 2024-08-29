package expo.modules.blueskyswissarmy.visibilityview

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoBlueskyVisibilityViewModule : Module() {
  override fun definition() =
    ModuleDefinition {
      Name("ExpoBlueskyVisibilityView")

      AsyncFunction("updateActiveViewAsync") {
        VisibilityViewManager.updateActiveView()
      }

      View(VisibilityView::class) {
        Events(arrayOf("onChangeStatus"))

        Prop("enabled") { view: VisibilityView, prop: Boolean ->
          view.isViewEnabled = prop
        }
      }
    }
}
