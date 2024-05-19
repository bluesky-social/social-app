import ExpoModulesCore
import Foundation
import SwiftUI

class TranslateViewProps: ObservableObject {
  @Published var text: String = ""
  @Published var children: [UIView]?
  @Published var onClose: EventDispatcher
  @Published var isPresented: Bool = false {
    didSet {
      if !isPresented {
        self.onClose()
      }
    }
  }

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
