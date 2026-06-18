import ExpoModulesCore
import AVFoundation

public class ExpoVideoCompressModule: Module {
  private var currentCompressor: VideoCompressor?

  public func definition() -> ModuleDefinition {
    Name("ExpoVideoCompress")

    Events("onProgress")

    AsyncFunction("probe") { (uri: String) -> [String: Any] in
      let url = URL(string: uri) ?? URL(fileURLWithPath: uri)
      return try await VideoProber.probe(url: url)
    }

    AsyncFunction("compress") { (uri: String, options: [String: Any]) -> [String: Any] in
      let url = URL(string: uri) ?? URL(fileURLWithPath: uri)
      let targetBitrate = options["targetBitrate"] as? Int ?? 3_000_000
      let maxSize = options["maxSize"] as? Int ?? 1920
      let jobId = options["jobId"] as? Int ?? 0

      let compressor = VideoCompressor(
        url: url,
        targetBitrate: targetBitrate,
        maxSize: maxSize,
        jobId: jobId,
        onProgress: { [weak self] id, progress in
          self?.sendEvent("onProgress", [
            "id": id,
            "progress": progress
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
