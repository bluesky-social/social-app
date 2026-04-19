import UIKit

/// Decodes the `preview` prop shipped from JS and constructs the right
/// `UIViewController` for the peek. Day-one only handles `image`. Add cases
/// here for `video` and `externalCard` follow-ups.
enum PreviewFactory {
  static func makeController(from spec: [String: Any]?) -> UIViewController? {
    guard let spec = spec,
          let type = spec["type"] as? String else { return nil }

    switch type {
    case "image":
      let uri = spec["uri"] as? String
      let url = uri.flatMap(URL.init(string:))
      let aspect = CGFloat((spec["aspectRatio"] as? Double) ?? 1)
      return ImagePreviewController(imageURL: url, aspectRatio: aspect)
    default:
      return nil
    }
  }
}
