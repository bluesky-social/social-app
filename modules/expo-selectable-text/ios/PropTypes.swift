import ExpoModulesCore

struct AccessibilityState: Record {
  @Field
  var disabled: Bool?
  @Field
  var selected: Bool?
  @Field
  var checked: Bool?
  @Field
  var busy: Bool?
  @Field
  var expanded: Bool?

  func toAccessibilityState() -> [String: Any] {
    return self.toDictionary()
  }
}

struct AccessibilityValue: Record {
  @Field
  var min: Int?
  @Field
  var max: Int?
  @Field
  var now: Int?
  @Field
  var text: String?
}

enum EllipsizeMode: String, Enumerable {
  case head
  case middle
  case tail
  case clip

  func toLineBreakMode() -> NSLineBreakMode {
    switch self {
    case .head:
      return .byTruncatingHead
    case .middle:
      return .byTruncatingMiddle
    case .tail:
      return .byTruncatingTail
    case .clip:
      return .byClipping
    }
  }
}
