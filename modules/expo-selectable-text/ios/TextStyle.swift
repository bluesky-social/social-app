struct TextStyle: Decodable {
  var color: String? = "black"
  var fontSize: CGFloat? = 12
  var fontStyle: String? = "normal"
  var fontWeight: FontWeight?
  var letterSpacing: Double?
  var textAlign: String? = "auto"
  var lineHeight: Double?
  var textDecorationLine: TextDecorationLine?
  var flex: Int?
}

enum FontWeight: String, Decodable {
  case bold
  case normal
  case one = "100"
  case two = "200"
  case three = "300"
  case four = "400"
  case five = "500"
  case six = "600"
  case seven = "700"
  case eight = "800"
  case nine = "900"

  func toFontWeight() -> UIFont.Weight {
    switch self {
    case .bold:
      return .bold
    case .normal:
      return .regular
    case .one:
      return .ultraLight
    case .two:
      return .ultraLight
    case .three:
      return .light
    case .four:
      return .regular
    case .five:
      return .medium
    case .six:
      return .semibold
    case .seven:
      return .semibold
    case .eight:
      return .bold
    case .nine:
      return .heavy
    }
  }
}

enum TextDecorationLine: String, Decodable {
  case underline
  case lineThrough = "line-through"
  case underlineLineThrough = "underline line-through"

  case normal
}
