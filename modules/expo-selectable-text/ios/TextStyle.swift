import ExpoModulesCore

struct TextStyle: Record {
  @Field
  var color: String? = "black"
  @Field
  var fontSize: CGFloat? = 12
  @Field
  var fontStyle: String? = "normal"
  @Field
  var fontWeight: FontWeight?
  @Field
  var letterSpacing: Double?
  @Field
  var textAlign: String? = "auto"
  @Field
  var lineHeight: Double?
  @Field
  var textDecorationLine: TextDecorationLine?
  @Field
  var flex: Int?
  @Field
  var pointerEvents: String?
}

enum FontWeight: String, Enumerable {
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

enum TextDecorationLine: String, Enumerable {
  case underline
  case lineThrough = "line-through"
  case underlineLineThrough = "underline line-through"
  case normal
}
