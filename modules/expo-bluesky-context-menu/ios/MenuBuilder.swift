import UIKit

/// Builds a `UIMenu` from the JS-shipped item specs. Each item may carry an
/// icon spec (SVG path data) which is rasterized via `IconRenderer`.
enum MenuBuilder {
  /// Expected item shape from JS:
  /// {
  ///   id: String,
  ///   label: String,
  ///   destructive?: Bool,
  ///   disabled?: Bool,
  ///   icon?: {
  ///     paths: [String],
  ///     viewBox: String,
  ///     strokeWidth: Double
  ///   }
  /// }
  static func build(items: [[String: Any]], onSelect: @escaping (String) -> Void) -> UIMenu {
    let actions: [UIMenuElement] = items.compactMap { spec in
      guard let id = spec["id"] as? String,
            let label = spec["label"] as? String else { return nil }

      let destructive = (spec["destructive"] as? Bool) ?? false
      let disabled = (spec["disabled"] as? Bool) ?? false
      let image = icon(from: spec["icon"] as? [String: Any])

      var attributes: UIMenuElement.Attributes = []
      if destructive { attributes.insert(.destructive) }
      if disabled { attributes.insert(.disabled) }

      return UIAction(title: label, image: image, attributes: attributes) { _ in
        onSelect(id)
      }
    }
    return UIMenu(title: "", children: actions)
  }

  private static func icon(from spec: [String: Any]?) -> UIImage? {
    guard let spec = spec,
          let paths = spec["paths"] as? [String], !paths.isEmpty else { return nil }
    let viewBox = (spec["viewBox"] as? String) ?? "0 0 24 24"
    let strokeWidth = CGFloat((spec["strokeWidth"] as? Double) ?? 0)
    let renderSpec = IconRenderer.Spec(
      paths: paths,
      viewBox: viewBox,
      strokeWidth: strokeWidth,
      pointSize: 24
    )
    return IconRenderer.image(for: renderSpec)
  }
}
