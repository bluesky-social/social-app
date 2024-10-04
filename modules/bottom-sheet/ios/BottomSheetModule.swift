import ExpoModulesCore

public class BottomSheetModule: Module {
  public func definition() -> ModuleDefinition {
    Name("BottomSheet")

    AsyncFunction("dismissAll") {
      SheetManager.shared.dismissAll()
    }

    View(SheetView.self) {
      Events([
        "onAttemptDismiss",
        "onSnapPointChange",
        "onStateChange"
      ])

      AsyncFunction("dismiss") { (view: SheetView) in
        view.dismiss()
      }

      AsyncFunction("updateLayout") { (view: SheetView) in
        view.updateLayout()
      }

      Prop("cornerRadius") { (view: SheetView, prop: Float) in
        view.cornerRadius = CGFloat(prop)
      }

      Prop("minHeight") { (view: SheetView, prop: Double) in
        view.minHeight = prop
      }

      Prop("maxHeight") { (view: SheetView, prop: Double) in
        view.maxHeight = prop
      }

      Prop("preventDismiss") { (view: SheetView, prop: Bool) in
        view.preventDismiss = prop
      }

      Prop("preventExpansion") { (view: SheetView, prop: Bool) in
        view.preventExpansion = prop
      }
    }
  }
}
