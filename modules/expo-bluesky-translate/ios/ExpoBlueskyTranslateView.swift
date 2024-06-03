import ExpoModulesCore
import Foundation
import SwiftUI

class TranslateViewState: ObservableObject {
  static var shared = TranslateViewState()
  
  @Published var isPresented = false
  @Published var text = ""
}

class ExpoBlueskyTranslateView: ExpoView {
  required init(appContext: AppContext? = nil) {
    if #available(iOS 14.0, *) {
      let hostingController = UIHostingController(rootView: TranslateView())
      super.init(appContext: appContext)
      setupHostingController(hostingController)
    } else {
      super.init(appContext: appContext)
    }
  }
}
