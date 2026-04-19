import UIKit

/// Renders SVG path data (the `d` attribute) into a `UIImage`. Supports the
/// subset of SVG path commands used by the Bluesky icon set: M/m, L/l, H/h,
/// V/v, C/c, S/s, Q/q, T/t, A/a, Z/z. Results are cached by (path, size, tint).
enum IconRenderer {
  private static let cache = NSCache<NSString, UIImage>()

  struct Spec: Hashable {
    let paths: [String]
    let viewBox: String
    let strokeWidth: CGFloat
    let pointSize: CGFloat
  }

  static func image(for spec: Spec) -> UIImage? {
    let key = cacheKey(spec) as NSString
    if let cached = cache.object(forKey: key) { return cached }

    guard let image = render(spec) else { return nil }
    cache.setObject(image, forKey: key)
    return image
  }

  private static func cacheKey(_ spec: Spec) -> String {
    return "\(spec.paths.joined(separator: "|"))|\(spec.viewBox)|\(spec.strokeWidth)|\(spec.pointSize)"
  }

  private static func render(_ spec: Spec) -> UIImage? {
    let viewBox = parseViewBox(spec.viewBox) ?? CGRect(x: 0, y: 0, width: 24, height: 24)
    let size = CGSize(width: spec.pointSize, height: spec.pointSize)
    let scaleX = size.width / viewBox.width
    let scaleY = size.height / viewBox.height
    let scale = min(scaleX, scaleY)

    let renderer = UIGraphicsImageRenderer(size: size)
    let image = renderer.image { ctx in
      let cg = ctx.cgContext
      cg.translateBy(x: -viewBox.origin.x * scale, y: -viewBox.origin.y * scale)
      cg.scaleBy(x: scale, y: scale)

      // Render in opaque black; callers use `.alwaysTemplate` so iOS tints
      // the icon with the menu's label color (and red for destructive items).
      UIColor.black.setFill()
      UIColor.black.setStroke()

      for pathString in spec.paths {
        let bezier = SVGPathParser.parse(pathString)
        if spec.strokeWidth > 0 {
          bezier.lineWidth = spec.strokeWidth
          bezier.lineCapStyle = .round
          bezier.lineJoinStyle = .round
          bezier.stroke()
        } else {
          bezier.usesEvenOddFillRule = false
          bezier.fill()
        }
      }
    }
    return image.withRenderingMode(.alwaysTemplate)
  }

  private static func parseViewBox(_ s: String) -> CGRect? {
    let parts = s.split(whereSeparator: { $0 == " " || $0 == "," })
      .compactMap { Double($0) }
    guard parts.count == 4 else { return nil }
    return CGRect(x: parts[0], y: parts[1], width: parts[2], height: parts[3])
  }
}

