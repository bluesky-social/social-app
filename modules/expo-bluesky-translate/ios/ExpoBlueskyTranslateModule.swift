import ExpoModulesCore
import Foundation
import SwiftUI

public class ExpoBlueskyTranslateModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoBlueskyTranslate")
    
    AsyncFunction("presentAsync") { (text: String) in
      DispatchQueue.main.async { [weak state = TranslateViewState.shared] in
        state?.isPresented = true
        state?.text = text
      }
    }
    
    View(ExpoBlueskyTranslateView.self) {}
  }
}
