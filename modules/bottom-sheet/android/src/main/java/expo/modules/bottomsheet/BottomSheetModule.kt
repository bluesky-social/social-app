package expo.modules.bottomsheet

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class BottomSheetModule : Module() {
  override fun definition() =
    ModuleDefinition {
      Name("BottomSheet")

      AsyncFunction("dismissAll") {
        SheetManager.dismissAll()
      }

      View(BottomSheetView::class) {
        Events(
          arrayOf(
            "onAttemptDismiss",
            "onSnapPointChange",
            "onStateChange",
          ),
        )

        AsyncFunction("dismiss") { view: BottomSheetView ->
          view.dismiss()
        }

        AsyncFunction("updateLayout") { view: BottomSheetView ->
          view.updateLayout()
        }

        Prop("disableDrag") { view: BottomSheetView, prop: Boolean ->
          view.disableDrag = prop
        }

        Prop("minHeight") { view: BottomSheetView, prop: Float ->
          view.minHeight = prop
        }

        Prop("maxHeight") { view: BottomSheetView, prop: Float ->
          view.maxHeight = prop
        }

        Prop("preventDismiss") { view: BottomSheetView, prop: Boolean ->
          view.preventDismiss = prop
        }

        Prop("preventExpansion") { view: BottomSheetView, prop: Boolean ->
          view.preventExpansion = prop
        }
      }
    }
}
