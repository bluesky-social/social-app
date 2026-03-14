package expo.modules.blueskyvideocompress

import android.media.MediaCodecInfo
import android.media.MediaCodecList
import android.os.Build
import android.util.Log

object CodecSelector {
  private const val TAG = "CodecSelector"

  // Known-bad hardware encoders
  // Source: https://github.com/numandev1/react-native-compressor/blob/f949b0868055178e7c8753e05202f784b1bcd589/android/src/main/java/com/reactnativecompressor/Video/VideoCompressor/compressor/Compressor.kt#L500
  private val DENYLIST = setOf(
    "c2.qti.avc.encoder",      // Qualcomm - known to produce corrupted output
  )

  private const val VIDEO_AVC = "video/avc"

  data class EncoderInfo(
    val name: String,
    val isHardware: Boolean
  )

  fun selectEncoder(): EncoderInfo {
    val codecList = MediaCodecList(MediaCodecList.REGULAR_CODECS)
    val codecInfos = codecList.codecInfos

    val hardwareEncoders = mutableListOf<MediaCodecInfo>()
    val softwareEncoders = mutableListOf<MediaCodecInfo>()

    for (codecInfo in codecInfos) {
      if (!codecInfo.isEncoder) continue
      val types = codecInfo.supportedTypes
      if (!types.any { it.equals(VIDEO_AVC, ignoreCase = true) }) continue
      if (DENYLIST.contains(codecInfo.name)) {
        Log.d(TAG, "Skipping denylisted encoder: ${codecInfo.name}")
        continue
      }

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        if (codecInfo.isHardwareAccelerated) {
          hardwareEncoders.add(codecInfo)
        } else {
          softwareEncoders.add(codecInfo)
        }
      } else {
        // Pre-API 29: heuristic - hardware encoders usually don't have "sw" or "google" in name
        val name = codecInfo.name.lowercase()
        if (!name.contains("sw") && !name.contains("google")) {
          hardwareEncoders.add(codecInfo)
        } else {
          softwareEncoders.add(codecInfo)
        }
      }
    }

    // Prefer hardware encoders
    val selected = hardwareEncoders.firstOrNull() ?: softwareEncoders.firstOrNull()

    if (selected == null) {
      throw RuntimeException("No H.264 encoder available")
    }

    val isHardware = hardwareEncoders.contains(selected)
    Log.d(TAG, "Selected encoder: ${selected.name} (hardware: $isHardware)")

    return EncoderInfo(
      name = selected.name,
      isHardware = isHardware
    )
  }

  fun selectSoftwareEncoder(): EncoderInfo? {
    val codecList = MediaCodecList(MediaCodecList.REGULAR_CODECS)

    for (codecInfo in codecList.codecInfos) {
      if (!codecInfo.isEncoder) continue
      if (!codecInfo.supportedTypes.any { it.equals(VIDEO_AVC, ignoreCase = true) }) continue
      if (DENYLIST.contains(codecInfo.name)) continue

      val isSoftware = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        codecInfo.isSoftwareOnly
      } else {
        val name = codecInfo.name.lowercase()
        name.contains("sw") || name.contains("google") || name.contains("c2.android")
      }

      if (isSoftware) {
        Log.d(TAG, "Selected software encoder: ${codecInfo.name}")
        return EncoderInfo(name = codecInfo.name, isHardware = false)
      }
    }

    return null
  }
}
