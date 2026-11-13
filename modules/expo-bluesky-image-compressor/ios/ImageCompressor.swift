import Foundation
import ImageIO
import UniformTypeIdentifiers

struct CompressedImage {
  let url: URL
  let width: Int
  let height: Int
  let size: Int
  let quality: Int
}

enum ImageCompressorError: LocalizedError {
  case invalidOptions
  case unsupportedSource(String)
  case decodingFailed(String)
  case encodingFailed
  case doesNotFit

  var errorDescription: String? {
    switch self {
    case .invalidOptions:
      return "maxDimension and maxBytes must be positive"
    case .unsupportedSource(let source):
      return "Unsupported image source: \(source)"
    case .decodingFailed(let source):
      return "Could not decode the image: \(source)"
    case .encodingFailed:
      return "Could not encode the image"
    case .doesNotFit:
      return "Unable to compress image"
    }
  }
}

/**
 Re-encodes an image as a JPEG that fits a pixel and byte budget. Only depends
 on ImageIO, so it can be exercised on macOS. See the README.
 */
enum ImageCompressor {
  static var maxDimensionAttempts: Int { 4 }
  static var shrinkFactor: Double { 0.8 }

  static func compress(
    uri: String,
    maxDimension: Int,
    maxBytes: Int,
    outputDirectory: URL
  ) throws -> CompressedImage {
    guard maxDimension > 0, maxBytes > 0 else {
      throw ImageCompressorError.invalidOptions
    }
    let source = try makeImageSource(uri)

    guard
      let properties = CGImageSourceCopyPropertiesAtIndex(source, 0, nil) as? [CFString: Any],
      let pixelWidth = properties[kCGImagePropertyPixelWidth] as? Int,
      let pixelHeight = properties[kCGImagePropertyPixelHeight] as? Int
    else {
      throw ImageCompressorError.decodingFailed(describe(uri))
    }

    var longSide = min(max(pixelWidth, pixelHeight), maxDimension)
    for _ in 0..<maxDimensionAttempts {
      let image = try decode(source, maxPixelSize: longSide, uri: uri)
      if let fit = try findEncoding(image, maxBytes: maxBytes) {
        let url = try write(fit.payload, to: outputDirectory)
        return CompressedImage(
          url: url,
          width: image.width,
          height: image.height,
          size: fit.size,
          quality: fit.quality
        )
      }
      longSide = Int(Double(max(image.width, image.height)) * shrinkFactor)
    }
    throw ImageCompressorError.doesNotFit
  }

  private static func makeImageSource(_ uri: String) throws -> CGImageSource {
    let source: CGImageSource?
    if uri.hasPrefix("data:") {
      guard let url = URL(string: uri), let data = try? Data(contentsOf: url) else {
        throw ImageCompressorError.decodingFailed(describe(uri))
      }
      source = CGImageSourceCreateWithData(data as CFData, nil)
    } else {
      let url = uri.hasPrefix("/") ? URL(fileURLWithPath: uri) : URL(string: uri)
      guard let url, url.isFileURL else {
        throw ImageCompressorError.unsupportedSource(describe(uri))
      }
      source = CGImageSourceCreateWithURL(
        url as CFURL,
        [kCGImageSourceShouldCache: false] as CFDictionary
      )
    }
    guard let source, CGImageSourceGetCount(source) > 0 else {
      throw ImageCompressorError.decodingFailed(describe(uri))
    }
    return source
  }

  /**
   Decodes straight to the target size instead of decoding at full size and
   then resizing, and applies the EXIF orientation so the output is upright.
   */
  private static func decode(_ source: CGImageSource, maxPixelSize: Int, uri: String) throws -> CGImage {
    let options: [CFString: Any] = [
      kCGImageSourceCreateThumbnailFromImageAlways: true,
      kCGImageSourceCreateThumbnailWithTransform: true,
      kCGImageSourceThumbnailMaxPixelSize: maxPixelSize,
      kCGImageSourceShouldCacheImmediately: true,
    ]
    guard let image = CGImageSourceCreateThumbnailAtIndex(source, 0, options as CFDictionary) else {
      throw ImageCompressorError.decodingFailed(describe(uri))
    }
    return image
  }

  private static func findEncoding(_ image: CGImage, maxBytes: Int) throws -> QualitySearch<Data>.Fit? {
    var search = QualitySearch<Data>(maxBytes: maxBytes)
    while let quality = search.nextQuality() {
      let data = try autoreleasepool { try encode(image, quality: quality) }
      search.record(quality: quality, size: data.count) { data }
    }
    return search.best
  }

  private static func encode(_ image: CGImage, quality: Int) throws -> Data {
    let data = NSMutableData()
    guard let destination = CGImageDestinationCreateWithData(
      data as CFMutableData,
      UTType.jpeg.identifier as CFString,
      1,
      nil
    ) else {
      throw ImageCompressorError.encodingFailed
    }
    /*
     * No metadata is passed, so none (including location) is written. The
     * color profile comes from the image itself, so Display P3 photos stay P3.
     */
    let options: [CFString: Any] = [
      kCGImageDestinationLossyCompressionQuality: Double(quality) / 100
    ]
    CGImageDestinationAddImage(destination, image, options as CFDictionary)
    guard CGImageDestinationFinalize(destination) else {
      throw ImageCompressorError.encodingFailed
    }
    return data as Data
  }

  private static func write(_ data: Data, to directory: URL) throws -> URL {
    try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
    let url = directory.appendingPathComponent(UUID().uuidString).appendingPathExtension("jpg")
    try data.write(to: url)
    return url
  }

  /** Keeps data URIs out of error messages. */
  private static func describe(_ uri: String) -> String {
    return uri.hasPrefix("data:") ? "data URI" : uri
  }
}
