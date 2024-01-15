import ExpoModulesCore

public class ExpoUITextViewModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoUITextView")

    View(ExpoUITextView.self) {
      Events("onViewLayout", "onTextLayout")

      Prop("accessibilityHint") { (view: ExpoUITextView, prop: String) in
        view.textView.accessibilityHint = prop
      }
      Prop("accessibilityLanguage") { (view: ExpoUITextView, prop: String) in
        view.textView.accessibilityLanguage = prop
      }
      Prop("accessibilityLabel") { (view: ExpoUITextView, prop: String) in
        view.textView.accessibilityLabel = prop
      }
      Prop("accessibilityRole") { (view: ExpoUITextView, prop: String) in
        view.textView.accessibilityRole = prop
      }
      Prop("accessibilityState") { (view: ExpoUITextView, prop: AccessibilityState) in
        view.textView.accessibilityState = prop.toAccessibilityState()
      }
      Prop("accessibilityValue") { (view: ExpoUITextView, prop: AccessibilityValue) in
        view.textView.accessibilityValue = prop.text
      }
      Prop("accessibilityViewIsModal") { (view: ExpoUITextView, prop: Bool) in
        view.textView.accessibilityViewIsModal = prop
      }
      Prop("accessibilityElementsHidden") { (view: ExpoUITextView, prop: Bool) in
        view.textView.accessibilityElementsHidden = prop
      }
      Prop("allowFontScaling") { (view: ExpoUITextView, prop: Bool) in
        view.textView.adjustsFontForContentSizeCategory = prop
      }
      Prop("numberOfLines") { (view: ExpoUITextView, prop: Int?) in
        view.textView.textContainer.maximumNumberOfLines = prop ?? 0

        if view.textView.attributedText != nil {
          view.setText()
        }
      }
      Prop("ellipsizeMode") { (view: ExpoUITextView, prop: EllipsizeMode) in
        print(prop.toLineBreakMode())
        view.textView.textContainer.lineBreakMode = prop.toLineBreakMode()
      }
      Prop("selectable") { (view: ExpoUITextView, prop: Bool) in
        view.textView.isSelectable = prop
      }
    }
  }
}


/**
 Children should have parity with React Native text props. The difference is that we will use the text prop for the text rather than getting it from children.
 */
public class ExpoUITextViewChildModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoUITextViewChild")

    View(ExpoUITextViewChild.self) {
      Events("onTextPress")

      Prop("text") { (view: ExpoUITextViewChild, prop: String) in
        view.text = prop
      }

      Prop("textStyle") { (view: ExpoUITextViewChild, prop: TextStyle) in
        view.style = prop
      }
    }
  }
}
