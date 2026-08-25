import AVFoundation
import ExpoModulesCore

public class ExpoBlueskyVideoCompressModule: Module {
  private var activeCompressors: [Int: VideoCompressor] = [:]
  private let activeCompressorsLock = NSLock()

  public func definition() -> ModuleDefinition {
    Name("ExpoBlueskyVideoCompress")

    Events("onProgress")

    AsyncFunction("probe") { (uri: String) -> [String: Any] in
      let url = URL(string: uri) ?? URL(fileURLWithPath: uri)
      return try await VideoProber.probe(url: url)
    }

    AsyncFunction("compress") { (uri: String, options: [String: Any]) -> [String: Any] in
      let url = URL(string: uri) ?? URL(fileURLWithPath: uri)
      let targetBitrate = options["targetBitrate"] as? Int ?? 0
      let maxSize = options["maxSize"] as? Int ?? 1920
      let codecPref = options["codec"] as? String ?? "auto"
      let frameRateCap = max(1, options["frameRateCap"] as? Int ?? 30)
      let jobId = options["jobId"] as? Int ?? 0

      let compressor = VideoCompressor(
        url: url,
        targetBitrate: targetBitrate,
        maxSize: maxSize,
        codecPref: codecPref,
        frameRateCap: frameRateCap,
        jobId: jobId,
        onProgress: { [weak self] id, progress in
          self?.sendEvent("onProgress", [
            "id": id,
            "progress": progress,
          ])
        }
      )

      self.setCompressor(jobId, compressor)

      do {
        let result = try await compressor.compress()
        self.setCompressor(jobId, nil)
        return result
      } catch {
        self.setCompressor(jobId, nil)
        throw error
      }
    }

    Function("cancel") { (jobId: Int) in
      self.cancelCompressor(jobId)
    }
  }

  private func setCompressor(_ jobId: Int, _ compressor: VideoCompressor?) {
    activeCompressorsLock.lock()
    defer { activeCompressorsLock.unlock() }
    if let compressor = compressor {
      activeCompressors[jobId] = compressor
    } else {
      activeCompressors.removeValue(forKey: jobId)
    }
  }

  private func cancelCompressor(_ jobId: Int) {
    activeCompressorsLock.lock()
    let compressor = activeCompressors.removeValue(forKey: jobId)
    activeCompressorsLock.unlock()
    compressor?.cancel()
  }
}
