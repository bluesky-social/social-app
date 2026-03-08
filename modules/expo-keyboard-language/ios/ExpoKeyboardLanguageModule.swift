import ExpoModulesCore

public class ExpoKeyboardLanguageModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoKeyboardLanguage")

    Events("onKeyboardLanguageChange")

    Function("getCurrentKeyboardLanguage") {
      return self.currentKeyboardLanguage()
    }

    OnStartObserving {
      NotificationCenter.default.addObserver(
        self,
        selector: #selector(self.onInputModeOrResponderChange),
        name: UITextInputMode.currentInputModeDidChangeNotification,
        object: nil
      )
      NotificationCenter.default.addObserver(
        self,
        selector: #selector(self.onInputModeOrResponderChange),
        name: UIResponder.keyboardDidShowNotification,
        object: nil
      )
    }

    OnStopObserving {
      NotificationCenter.default.removeObserver(
        self,
        name: UITextInputMode.currentInputModeDidChangeNotification,
        object: nil
      )
      NotificationCenter.default.removeObserver(
        self,
        name: UIResponder.keyboardDidShowNotification,
        object: nil
      )
    }
  }

  private var lastLanguage: String?

  @objc
  private func onInputModeOrResponderChange() {
    let language = currentKeyboardLanguage()
    if language != lastLanguage {
      lastLanguage = language
      sendEvent("onKeyboardLanguageChange", [
        "language": language as Any
      ])
    }
  }

  private func currentKeyboardLanguage() -> String? {
    let keyWindow = UIApplication.shared.connectedScenes
      .compactMap { $0 as? UIWindowScene }
      .flatMap { $0.windows }
      .first { $0.isKeyWindow }

    return keyWindow?.findFirstResponder()?.textInputMode?.primaryLanguage
  }
}

private extension UIView {
  func findFirstResponder() -> UIView? {
    if isFirstResponder { return self }
    for subview in subviews {
      if let found = subview.findFirstResponder() {
        return found
      }
    }
    return nil
  }
}
