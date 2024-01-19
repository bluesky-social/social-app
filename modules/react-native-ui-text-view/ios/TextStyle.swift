@objcMembers class TextStyle: NSObject {
  var color: String? = "black"
  var fontSize: CGFloat? = 16.0
  var fontStyle: String? = "normal"
  var fontWeight: String?
  var letterSpacing: Float?
  var textAlign: String? = "auto"
  var lineHeight: Float?
  var textDecorationLine: String?
  var flex: Int?
  var pointerEvents: String?

  func parseFontWeight() -> UIFont.Weight {
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
    case nil:
      return .regular
    case .some(_):
      return .regular
    }
  }
}
