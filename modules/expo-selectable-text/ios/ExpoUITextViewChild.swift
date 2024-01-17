import ExpoModulesCore

class ExpoUITextViewChild: ExpoView {
  var text: String?
  var style: TextStyle?
  let onTextPress = EventDispatcher()

  override func didSetProps(_ changedProps: [String]!) {
    let superview = self.superview as? ExpoUITextView
    superview?.setText()
  }
}
