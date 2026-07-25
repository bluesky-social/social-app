package expo.modules.blueskyvideocompress

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.concurrent.ConcurrentHashMap

class ExpoBlueskyVideoCompressModule : Module() {
  private val activeCompressors = ConcurrentHashMap<Int, VideoCompressor>()

  override fun definition() = ModuleDefinition {
    Name("ExpoBlueskyVideoCompress")

    Events("onProgress")

    AsyncFunction("probe") { uri: String ->
      val context = appContext.reactContext
        ?: throw Error("React context is null")
      return@AsyncFunction VideoProber.probe(context, uri)
    }

    AsyncFunction("compress") { uri: String, options: Map<String, Any?> ->
      val context = appContext.reactContext
        ?: throw Error("React context is null")
      val targetBitrate = (options["targetBitrate"] as? Number)?.toInt() ?: 0
      val maxSize = (options["maxSize"] as? Number)?.toInt() ?: 1920
      val codecPref = (options["codec"] as? String) ?: "auto"
      val frameRateCap = ((options["frameRateCap"] as? Number)?.toInt() ?: 30).coerceAtLeast(1)
      val jobId = (options["jobId"] as? Number)?.toInt() ?: 0

      val compressor = VideoCompressor(
        context = context,
        uriString = uri,
        targetBitrate = targetBitrate,
        maxSize = maxSize,
        codecPref = codecPref,
        frameRateCap = frameRateCap,
        jobId = jobId,
        onProgress = { id, progress ->
          sendEvent("onProgress", mapOf(
            "id" to id,
            "progress" to progress
          ))
        }
      )

      activeCompressors[jobId] = compressor

      try {
        val result = compressor.compress()
        activeCompressors.remove(jobId)
        return@AsyncFunction result
      } catch (e: Exception) {
        activeCompressors.remove(jobId)
        throw e
      }
    }

    Function("cancel") { jobId: Int ->
      activeCompressors.remove(jobId)?.cancel()
    }
  }
}
