import ExpoModulesCore
import Foundation
import SwiftUI

class TranslateViewProps: ObservableObject {
  @Published var text: String = ""
  @Published var isPresented: Bool = false
  @Published var children: [UIView]?
  @Published var onEvent: EventDispatcher
  init(onEvent: EventDispatcher) {
    self.onEvent = onEvent
  }
}

class ExpoBlueskyTranslateView: ExpoView {
  let props: TranslateViewProps
  let onEvent = EventDispatcher()

  override func didUpdateReactSubviews() {
    let subChildren = self.reactSubviews()
    props.children = subChildren
  }

  required init(appContext: AppContext? = nil) {
    props = TranslateViewProps(onEvent: onEvent)
    let hostingController = UIHostingController(rootView: TranslateView(props: props))
    super.init(appContext: appContext)
    setupHostingController(hostingController)
  }
}
