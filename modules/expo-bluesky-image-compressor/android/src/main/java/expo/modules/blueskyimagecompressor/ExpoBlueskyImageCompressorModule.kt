package expo.modules.blueskyimagecompressor

import android.net.Uri
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File

class ExpoBlueskyImageCompressorModule : Module() {
  override fun definition() =
    ModuleDefinition {
      Name("ExpoBlueskyImageCompressor")

      AsyncFunction("compressAsync") Coroutine { uri: String, options: CompressOptions ->
        val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
        val outputDirectory = File(appContext.cacheDirectory, "ImageCompressor")
        withContext(Dispatchers.Default) {
          val result =
            ImageCompressor(context.contentResolver).compress(
              uri = uri,
              maxDimension = options.maxDimension,
              maxBytes = options.maxBytes,
              outputDirectory = outputDirectory,
            )
          mapOf(
            "uri" to Uri.fromFile(result.file).toString(),
            "width" to result.width,
            "height" to result.height,
            "size" to result.size,
            "quality" to result.quality,
          )
        }
      }
    }
}

class CompressOptions : Record {
  @Field
  val maxDimension: Int = 0

  @Field
  val maxBytes: Int = 0
}
