import ExpoModulesCore

public class ExpoBlueskyImageCompressorModule: Module {
  /*
   * Async functions run on a single serial queue shared by every Expo module
   * by default, so a compression taking a few seconds would hold up everyone
   * else's. JS limits how many compressions run at once.
   */
  private let queue = DispatchQueue(
    label: "xyz.blueskyweb.image-compressor",
    qos: .userInitiated,
    attributes: .concurrent
  )

  public func definition() -> ModuleDefinition {
    Name("ExpoBlueskyImageCompressor")

    AsyncFunction("compressAsync") { (uri: String, options: CompressOptions) -> [String: Any] in
      guard let cacheDirectory = self.appContext?.config.cacheDirectory else {
        throw Exceptions.AppContextLost()
      }
      let result = try ImageCompressor.compress(
        uri: uri,
        maxDimension: options.maxDimension,
        maxBytes: options.maxBytes,
        outputDirectory: cacheDirectory.appendingPathComponent("ImageCompressor")
      )
      return [
        "uri": result.url.absoluteString,
        "width": result.width,
        "height": result.height,
        "size": result.size,
        "quality": result.quality,
      ]
    }
    .runOnQueue(queue)
  }
}

struct CompressOptions: Record {
  @Field var maxDimension: Int = 0
  @Field var maxBytes: Int = 0
}
