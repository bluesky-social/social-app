@objc(RNUITextViewManager)
class RNUITextViewManager: RCTViewManager {
  var textStorage = NSTextStorage()

  override func view() -> (RNUITextView) {
    return RNUITextView()
  }

  @objc override static func requiresMainQueueSetup() -> Bool {
    return true
  }

  override func shadowView() -> RCTShadowView {
    // Pass the bridge to the shadow view
    return RNUITextViewShadowView(bridge: self.bridge)
  }
}

@objc(RNUITextViewChildManager)
class RNUITextViewChildManager: RCTViewManager {
  override func view() -> (RNUITextViewChild) {
    return RNUITextViewChild()
  }

  @objc override static func requiresMainQueueSetup() -> Bool {
    return true
  }

  override func shadowView() -> RCTShadowView {
    return RNUITextViewChildShadowView()
  }
}
