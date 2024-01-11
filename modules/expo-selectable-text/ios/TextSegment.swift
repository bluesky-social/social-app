import ExpoModulesCore

struct TextSegments: Decodable {
  let segments: Array<TextSegment>
}

struct TextSegment: Decodable {
  let index: Int
  let text: String
  let style: TextStyle?
  let handlePress: Bool
  let handleLongPress: Bool
}
