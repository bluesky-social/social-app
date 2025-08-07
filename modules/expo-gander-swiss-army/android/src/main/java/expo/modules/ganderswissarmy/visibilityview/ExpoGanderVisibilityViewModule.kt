package expo.modules.ganderswissarmy.visibilityview

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoGanderVisibilityViewModule : Module() {
  override fun definition() =
    ModuleDefinition {
      Name("ExpoGanderVisibilityView")

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
