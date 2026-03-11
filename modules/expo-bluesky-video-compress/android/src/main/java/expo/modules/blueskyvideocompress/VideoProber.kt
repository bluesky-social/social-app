package expo.modules.blueskyvideocompress

import android.content.Context
import android.media.MediaExtractor
import android.media.MediaFormat
import android.media.MediaMetadataRetriever
import android.net.Uri

object VideoProber {
  fun probe(context: Context, uriString: String): Map<String, Any> {
    val uri = Uri.parse(uriString)
    val retriever = MediaMetadataRetriever()

    try {
      if (uriString.startsWith("content://") || uriString.startsWith("file://")) {
        retriever.setDataSource(context, uri)
      } else {
        retriever.setDataSource(uriString)
      }

      val width = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_WIDTH)
        ?.toIntOrNull() ?: 0
      val height = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_HEIGHT)
        ?.toIntOrNull() ?: 0
      val durationMs = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)
        ?.toLongOrNull() ?: 0L
      val rotation = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_ROTATION)
        ?.toIntOrNull() ?: 0
      val bitrate = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_BITRATE)
        ?.toIntOrNull() ?: 0
      val hasAudio = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_HAS_AUDIO)
        ?.equals("yes") ?: false
      val frameRate = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_CAPTURE_FRAMERATE)
        ?.toFloatOrNull() ?: 0f

      // Get file size
      val fileSize = getFileSize(context, uriString)

      // Get codec and frame rate from MediaExtractor for more accuracy
      val extractor = MediaExtractor()
      var codec = "unknown"
      var mimeType = "video/mp4"
      var extractedFrameRate = frameRate

      try {
        if (uriString.startsWith("content://") || uriString.startsWith("file://")) {
          extractor.setDataSource(context, uri, null)
        } else {
          extractor.setDataSource(uriString)
        }

        for (i in 0 until extractor.trackCount) {
          val format = extractor.getTrackFormat(i)
          val mime = format.getString(MediaFormat.KEY_MIME)
          if (mime?.startsWith("video/") == true) {
            mimeType = mime
            codec = mime.removePrefix("video/")
            if (format.containsKey(MediaFormat.KEY_FRAME_RATE)) {
              extractedFrameRate = format.getInteger(MediaFormat.KEY_FRAME_RATE).toFloat()
            }
            break
          }
        }
      } finally {
        extractor.release()
      }

      // Calculate bitrate from file size if not available
      val durationSeconds = durationMs / 1000.0
      val effectiveBitrate = if (bitrate > 0) {
        bitrate
      } else if (durationSeconds > 0 && fileSize > 0) {
        (fileSize * 8 / durationSeconds).toInt()
      } else {
        0
      }

      return mapOf(
        "width" to width,
        "height" to height,
        "duration" to durationSeconds,
        "bitrate" to effectiveBitrate,
        "fileSize" to fileSize,
        "mimeType" to mimeType,
        "codec" to codec,
        "hasAudio" to hasAudio,
        "frameRate" to extractedFrameRate.toDouble(),
        "rotation" to rotation
      )
    } finally {
      retriever.release()
    }
  }

  private fun getFileSize(context: Context, uriString: String): Long {
    return try {
      if (uriString.startsWith("content://")) {
        context.contentResolver.openFileDescriptor(Uri.parse(uriString), "r")?.use {
          it.statSize
        } ?: 0L
      } else {
        val path = if (uriString.startsWith("file://")) {
          uriString.removePrefix("file://")
        } else {
          uriString
        }
        java.io.File(path).length()
      }
    } catch (e: Exception) {
      0L
    }
  }
}
