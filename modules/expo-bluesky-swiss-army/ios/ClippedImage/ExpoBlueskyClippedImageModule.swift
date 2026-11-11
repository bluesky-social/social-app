import CryptoKit
import ExpoModulesCore
import UIKit

/// Renders a remote image clipped to a rounded rect (or a circle) and caches
/// it as a PNG on disk. UIKit surfaces that take an image source, like native
/// tab bar items, can't clip images themselves, so this lets them show avatars.
public class ExpoBlueskyClippedImageModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoBlueskyClippedImage")

    AsyncFunction("clipImageAsync") {
      (
        url: URL, size: Double, cornerRadius: Double, scale: Double, borderColor: UIColor?,
        borderWidth: Double
      ) async throws -> String in
      let borderKey = borderColor.map { "\($0.cgColor.components ?? [])|\(borderWidth)" } ?? ""
      let file = try Self.cacheFile(
        for: "\(url.absoluteString)|\(size)|\(cornerRadius)|\(scale)|\(borderKey)")
      if FileManager.default.fileExists(atPath: file.path) {
        return file.absoluteString
      }

      let (data, response) = try await URLSession.shared.data(from: url)
      if let response = response as? HTTPURLResponse,
        !(200..<300).contains(response.statusCode)
      {
        throw ClippedImageLoadException(url.absoluteString)
      }
      guard let image = UIImage(data: data), image.size.width > 0, image.size.height > 0
      else {
        throw ClippedImageLoadException(url.absoluteString)
      }

      let rect = CGRect(x: 0, y: 0, width: size, height: size)
      let format = UIGraphicsImageRendererFormat()
      format.scale = scale
      format.opaque = false
      let png = UIGraphicsImageRenderer(size: rect.size, format: format).pngData { _ in
        UIBezierPath(roundedRect: rect, cornerRadius: cornerRadius).addClip()
        // Aspect fill, centred
        let fill = max(size / image.size.width, size / image.size.height)
        let width = image.size.width * fill
        let height = image.size.height * fill
        image.draw(
          in: CGRect(x: (size - width) / 2, y: (size - height) / 2, width: width, height: height))

        // An inset border, like `MediaInsetBorder` on `UserAvatar`
        if let borderColor, borderWidth > 0 {
          let border = UIBezierPath(
            roundedRect: rect.insetBy(dx: borderWidth / 2, dy: borderWidth / 2),
            cornerRadius: max(0, cornerRadius - borderWidth / 2))
          border.lineWidth = borderWidth
          borderColor.setStroke()
          border.stroke()
        }
      }

      try png.write(to: file, options: .atomic)
      return file.absoluteString
    }
  }

  private static func cacheFile(for key: String) throws -> URL {
    let directory = FileManager.default
      .urls(for: .cachesDirectory, in: .userDomainMask)[0]
      .appendingPathComponent("ClippedImages", isDirectory: true)
    try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
    let hash = SHA256.hash(data: Data(key.utf8)).map { String(format: "%02x", $0) }.joined()
    return directory.appendingPathComponent("\(hash).png")
  }
}

internal final class ClippedImageLoadException: GenericException<String> {
  override var reason: String {
    "Failed to load image from \(param)"
  }
}
