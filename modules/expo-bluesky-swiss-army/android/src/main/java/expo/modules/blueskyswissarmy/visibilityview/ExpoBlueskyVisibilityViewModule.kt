package expo.modules.blueskyswissarmy.visibilityview

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.modules.ModuleDefinitionData
import java.util.jar.Attributes.Name

class ExpoBlueskyVisibilityViewModule: Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoBlueskyVisibilityView")

    View(VisibilityView::class.java) {

    }
  }
}