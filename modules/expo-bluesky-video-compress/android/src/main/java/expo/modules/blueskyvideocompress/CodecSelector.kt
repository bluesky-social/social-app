package expo.modules.blueskyvideocompress

import android.media.MediaCodecInfo
import android.media.MediaCodecList
import android.media.MediaFormat
import android.os.Build

object CodecSelector {
  // Source: https://github.com/numandev1/react-native-compressor/blob/f949b0868055178e7c8753e05202f784b1bcd589/android/src/main/java/com/reactnativecompressor/Video/VideoCompressor/compressor/Compressor.kt#L500
  private val AVC_DENYLIST = setOf(
    "c2.qti.avc.encoder"
  )

  private val SOFTWARE_PREFIXES = listOf(
    "OMX.google.",
    "c2.android.",
    "c2.google."
  )

  data class EncoderInfo(
    val name: String,
    val mime: String,
    val isHardware: Boolean
  )

  fun findEncoder(mime: String, requireHardware: Boolean): EncoderInfo? {
    val codecList = MediaCodecList(MediaCodecList.REGULAR_CODECS)
    val candidates = codecList.codecInfos
      .filter { it.isEncoder }
      .filter { it.supportedTypes.any { t -> t.equals(mime, ignoreCase = true) } }
      .filter { !it.name.contains("secure", ignoreCase = true) }
      .filter { !(mime == MediaFormat.MIMETYPE_VIDEO_AVC && AVC_DENYLIST.contains(it.name)) }

    val hardware = candidates.filter { isHardware(it) }
    val selected = if (requireHardware) {
      hardware.firstOrNull()
    } else {
      hardware.firstOrNull() ?: candidates.firstOrNull()
    }
    selected ?: return null
    return EncoderInfo(
      name = selected.name,
      mime = mime,
      isHardware = isHardware(selected)
    )
  }

  private fun isHardware(info: MediaCodecInfo): Boolean {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      info.isHardwareAccelerated
    } else {
      SOFTWARE_PREFIXES.none { info.name.startsWith(it, ignoreCase = true) }
    }
  }
}
