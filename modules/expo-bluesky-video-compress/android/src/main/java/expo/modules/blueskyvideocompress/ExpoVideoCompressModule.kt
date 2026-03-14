package expo.modules.blueskyvideocompress

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoVideoCompressModule : Module() {
  private var currentCompressor: VideoCompressor? = null

  override fun definition() =
    ModuleDefinition {
      Name("ExpoVideoCompress")

      Events("onProgress")

      AsyncFunction("probe") { uri: String ->
        val context = appContext.reactContext
          ?: throw Error("React context is null")
        return@AsyncFunction VideoProber.probe(context, uri)
      }

      AsyncFunction("compress") { uri: String, options: Map<String, Any?> ->
        val context = appContext.reactContext
          ?: throw Error("React context is null")
        val targetBitrate = (options["targetBitrate"] as? Number)?.toInt() ?: 3_000_000
        val maxSize = (options["maxSize"] as? Number)?.toInt() ?: 1920
        val jobId = (options["jobId"] as? Number)?.toInt() ?: 0

        val compressor = VideoCompressor(
          context = context,
          uri = uri,
          targetBitrate = targetBitrate,
          maxSize = maxSize,
          jobId = jobId,
          onProgress = { id, progress ->
            sendEvent("onProgress", mapOf(
              "id" to id,
              "progress" to progress
            ))
          }
        )

        currentCompressor = compressor

        try {
          val result = compressor.compress()
          currentCompressor = null
          return@AsyncFunction result
        } catch (e: Exception) {
          currentCompressor = null
          throw e
        }
      }

      Function("cancel") {
        currentCompressor?.cancel()
        currentCompressor = null
      }
    }
}
