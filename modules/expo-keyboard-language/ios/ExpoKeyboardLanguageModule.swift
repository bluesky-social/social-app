import ExpoModulesCore

public class ExpoKeyboardLanguageModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoKeyboardLanguage")

    Function("getKeyboardLanguage") { (nodeHandle: Int) -> String? in
      guard let view = self.appContext?.findView(withTag: nodeHandle, ofType: UIView.self) else {
        return nil
      }

      if let textInput = self.findTextInput(in: view) {
        return textInput.textInputMode?.primaryLanguage
      }

      return view.textInputMode?.primaryLanguage
    }
  }

  private func findTextInput(in view: UIView) -> UIView? {
    if view is UITextField || view is UITextView {
      return view
    }

    for subview in view.subviews {
      if let found = findTextInput(in: subview) {
        return found
      }
    }

    return nil
  }
}
