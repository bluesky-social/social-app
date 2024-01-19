// We want all of our props to be available in the child's shadow view so we
// can create the attributed text before mount and calculate the needed size
// for the view.
class RNUITextViewChildShadow: RCTShadowView {
  @objc var text: String = ""
  @objc var color: UIColor = .black
  @objc var fontSize: CGFloat = 16.0
  @objc var fontStyle: String = "normal"
  @objc var fontWeight: String = "normal"
  @objc var letterSpacing: CGFloat = 0.0
  @objc var lineHeight: CGFloat = 0.0
  @objc var pointerEvents: NSString?

  override func isYogaLeafNode() -> Bool {
    return true
  }

  override func didSetProps(_ changedProps: [String]!) {
    guard let superview = self.superview as? RNUITextViewShadow else {
      return
    }

    if !YGNodeIsDirty(superview.yogaNode) {
      superview.setAttributedText()
    }
  }

  func getFontWeight() -> UIFont.Weight {
    switch self.fontWeight {
    case "bold":
      return .bold
    case "normal":
      return .regular
    case "100":
      return .ultraLight
    case "200":
      return .ultraLight
    case "300":
      return .light
    case "400":
      return .regular
    case "500":
      return .medium
    case "600":
      return .semibold
    case "700":
      return .semibold
    case "800":
      return .bold
    case "900":
      return .heavy
    default:
      return .regular
    }
  }
}
