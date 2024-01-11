struct TextStyle: Decodable {
  var color: String? = "black"
  var fontSize: CGFloat? = 12
  var fontStyle: String? = "normal"
  var fontWeight: FontWeight?
  var letterSpacing: Double?
  var textAlign: String? = "auto"
  var lineHeight: Double?
  var textDecorationLine: TextDecorationLine?
}

enum FontWeight: String, Decodable {
  case bold
  case normal

  func toFontWeight() -> UIFont.Weight {
    switch self {
    case .bold:
      return .bold
    case .normal:
      return .regular
    }
  }
}

enum TextDecorationLine: String, Decodable {
  case underline
  case lineThrough = "line-through"
  case underlineLineThrough = "underline line-through"
  case normal
}
