import ExpoModulesCore
import Foundation
import SwiftUI

class TranslateViewProps: ObservableObject {
  var text: String = ""
  @Published var isPresented: Bool = false {
    didSet {
      if !isPresented {
        self.onClose()
      }
    }
  }
  var children: [UIView]?
  var onClose: EventDispatcher
  init(onClose: EventDispatcher) {
    self.onClose = onClose
  }
}

class ExpoBlueskyTranslateView: ExpoView {
  let props: TranslateViewProps
  let onClose = EventDispatcher()

  override func didUpdateReactSubviews() {
    let subChildren = self.reactSubviews()
    props.children = subChildren
  }

  required init(appContext: AppContext? = nil) {
    props = TranslateViewProps(onClose: onClose)
    let hostingController = UIHostingController(rootView: TranslateView(props: props))
    super.init(appContext: appContext)
    setupHostingController(hostingController)
  }
}
