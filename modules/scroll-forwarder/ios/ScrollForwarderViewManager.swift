@objc(ScrollForwarderViewManager)
class ScrollForwarderViewManager: RCTViewManager {

  override func view() -> (ScrollForwarderView) {
    return ScrollForwarderView(bridge: self.bridge)
  }

  @objc override static func requiresMainQueueSetup() -> Bool {
    return true
  }
}
