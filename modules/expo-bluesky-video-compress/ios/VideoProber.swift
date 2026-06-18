import AVFoundation
import UniformTypeIdentifiers

struct VideoProber {
  static func probe(url: URL) async throws -> [String: Any] {
    let asset = AVURLAsset(url: url)

    let duration = try await asset.load(.duration)
    let tracks = try await asset.loadTracks(withMediaType: .video)

    guard let videoTrack = tracks.first else {
      throw NSError(
        domain: "ExpoVideoCompress",
        code: 1,
        userInfo: [NSLocalizedDescriptionKey: "No video track found"]
      )
    }

    let naturalSize = try await videoTrack.load(.naturalSize)
    let preferredTransform = try await videoTrack.load(.preferredTransform)
    let estimatedDataRate = try await videoTrack.load(.estimatedDataRate)
    let nominalFrameRate = try await videoTrack.load(.nominalFrameRate)
    let formatDescriptions = try await videoTrack.load(.formatDescriptions)

    // Determine codec from format descriptions
    var codec = "unknown"
    if let formatDescription = formatDescriptions.first {
      let mediaSubType = CMFormatDescriptionGetMediaSubType(formatDescription)
      codec = fourCCToString(mediaSubType)
    }

    // Detect rotation from transform
    let rotation = rotationFromTransform(preferredTransform)

    // Apply rotation to get display size
    let isRotated = rotation == 90 || rotation == 270
    let width = isRotated ? Int(naturalSize.height) : Int(naturalSize.width)
    let height = isRotated ? Int(naturalSize.width) : Int(naturalSize.height)

    // Check for audio track
    let audioTracks = try await asset.loadTracks(withMediaType: .audio)
    let hasAudio = !audioTracks.isEmpty

    // Get file size
    let fileSize: Int
    if let attributes = try? FileManager.default.attributesOfItem(atPath: url.path),
       let size = attributes[.size] as? Int {
      fileSize = size
    } else {
      fileSize = 0
    }

    // MIME type from file extension
    let mimeType: String
    if let utType = UTType(filenameExtension: url.pathExtension) {
      mimeType = utType.preferredMIMEType ?? "video/mp4"
    } else {
      mimeType = "video/mp4"
    }

    // Bitrate: use estimated data rate, or calculate from file size
    let durationSeconds = CMTimeGetSeconds(duration)
    var bitrate = Int(estimatedDataRate)
    if bitrate == 0 && durationSeconds > 0 {
      bitrate = Int(Double(fileSize * 8) / durationSeconds)
    }

    return [
      "width": width,
      "height": height,
      "duration": durationSeconds,
      "bitrate": bitrate,
      "fileSize": fileSize,
      "mimeType": mimeType,
      "codec": codec,
      "hasAudio": hasAudio,
      "frameRate": nominalFrameRate,
      "rotation": rotation
    ]
  }

  private static func rotationFromTransform(_ transform: CGAffineTransform) -> Int {
    let angle = atan2(transform.b, transform.a)
    let degrees = Int(round(angle * 180.0 / .pi))
    // Normalize to 0, 90, 180, 270
    let normalized = ((degrees % 360) + 360) % 360
    return normalized
  }

  private static func fourCCToString(_ code: FourCharCode) -> String {
    let chars: [Character] = [
      Character(UnicodeScalar((code >> 24) & 0xFF)!),
      Character(UnicodeScalar((code >> 16) & 0xFF)!),
      Character(UnicodeScalar((code >> 8) & 0xFF)!),
      Character(UnicodeScalar(code & 0xFF)!)
    ]
    return String(chars).trimmingCharacters(in: .whitespaces)
  }
}
