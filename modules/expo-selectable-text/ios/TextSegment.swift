import ExpoModulesCore

struct TextSegments: Record {
  @Field
  var segments: Array<TextSegment>
}

struct TextSegment: Record {
  @Field
  var index: Int
  @Field
  var text: String
  @Field
  var style: TextStyle?
}
