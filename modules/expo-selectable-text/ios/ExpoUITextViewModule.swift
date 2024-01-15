import ExpoModulesCore

public class ExpoUITextViewModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoSelectableText")

    View(ExpoUITextView.self) {
    }
  }
}


/**
 Children should have parity with React Native text props. The difference is that we will use the text prop for the text rather than getting it from children.
 */
public class ExpoUITextViewChildModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoTextChild")

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
