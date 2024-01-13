import ExpoModulesCore


struct TextSegment: Decodable {
  let index: Int
  let text: String
  let style: TextStyle?
  let handlePress: Bool
  let handleLongPress: Bool
}
