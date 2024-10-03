package expo.modules.bottomsheet

import android.graphics.Color
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class BottomSheetModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("BlueskyBottomSheet")

    Function("getSafeAreaInset") {
      return@Function 10 // @TODO
    }

    View(BottomSheetView::class) {
      Events(arrayOf(
        "onStateChange",
        "onAttemptDismiss",
      ))

      AsyncFunction("dismiss") { view: BottomSheetView ->
        view.dismiss()
      }

      Prop("preventDismiss") { view: BottomSheetView, prop: Boolean ->
        view.preventDismiss = prop
      }

      Prop("minHeight") { view: BottomSheetView, prop: Float ->
        view.minHeight = prop
      }

      Prop("maxHeight") { view: BottomSheetView, prop: Float ->
        view.maxHeight = prop
      }

      Prop("cornerRadius") { view: BottomSheetView, prop: Float ->
        view.sheetState.value.cornerRadius = prop
      }

      Prop("containerBackgroundColor") { view: BottomSheetView, prop: String ->
        view.sheetState.value.containerBackgroundColor = Color.parseColor(prop)
      }

      Prop("preventExpansion") { view: BottomSheetView, prop: Boolean ->
        view.sheetState.value.preventExpansion = prop
      }
    }
  }
}
