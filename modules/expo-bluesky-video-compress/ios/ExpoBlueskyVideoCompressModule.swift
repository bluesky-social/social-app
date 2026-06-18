import AVFoundation
import ExpoModulesCore

public class ExpoBlueskyVideoCompressModule: Module {
  private var currentCompressor: VideoCompressor?

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
      let frameRateCap = options["frameRateCap"] as? Int ?? 30
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

      self.currentCompressor = compressor

      do {
        let result = try await compressor.compress()
        self.currentCompressor = nil
        return result
      } catch {
        self.currentCompressor = nil
        throw error
      }
    }

    Function("cancel") {
      self.currentCompressor?.cancel()
      self.currentCompressor = nil
    }
  }
}
