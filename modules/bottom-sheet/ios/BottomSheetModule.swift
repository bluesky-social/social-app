import ExpoModulesCore
import UIKit

enum BottomSheetPopoverMode: String, Enumerable {
  case always
  case adaptive
  case never
}

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
        "onStateChange",
        "onPresentationSizeChange"
      ])

      AsyncFunction("dismiss") { (view: SheetView) in
        view.dismiss()
      }

      Prop("fullHeight") { (view: SheetView, prop: Bool) in
        view.fullHeight = prop
      }

      Prop("cornerRadius") { (view: SheetView, prop: Float) in
        view.cornerRadius = CGFloat(prop)
      }

      Prop("containerBackgroundColor") { (view: SheetView, prop: UIColor?) in
        view.containerBackgroundColor = prop
      }

      Prop("minHeight") { (view: SheetView, prop: Double) in
        view.minHeight = CGFloat(prop)
      }

      Prop("maxHeight") { (view: SheetView, prop: Double?) in
        view.maxHeight = prop.map { CGFloat($0) }
      }
      Prop("desiredContentHeight") { (view: SheetView, prop: Double?) in
        view.desiredContentHeight = prop.map { CGFloat($0) }
      }

      Prop("preventDismiss") { (view: SheetView, prop: Bool) in
        view.preventDismiss = prop
      }

      Prop("preventExpansion") { (view: SheetView, prop: Bool) in
        view.preventExpansion = prop
      }

      Prop("popover") { (view: SheetView, prop: BottomSheetPopoverMode) in
        view.popover = prop
      }

      Prop("popoverWidth") { (view: SheetView, prop: Double?) in
        if let prop = prop, prop > 0 {
          view.popoverWidth = CGFloat(prop)
        }
      }

      Prop("sourceViewTag") { (view: SheetView, prop: Int?) in
        view.sourceViewTag = prop
      }
    }
  }
}
