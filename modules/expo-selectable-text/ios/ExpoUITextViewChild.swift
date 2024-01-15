import ExpoModulesCore

class ExpoUITextViewChild: ExpoView {
  var text: String?
  var style: TextStyle?
  let onTextPress = EventDispatcher()
}
