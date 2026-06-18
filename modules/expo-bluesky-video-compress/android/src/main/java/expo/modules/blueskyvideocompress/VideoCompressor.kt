package expo.modules.blueskyvideocompress

import android.content.Context
import android.media.MediaCodec
import android.media.MediaCodecInfo
import android.media.MediaExtractor
import android.media.MediaFormat
import android.media.MediaMuxer
import android.net.Uri
import android.os.Build
import android.util.Log
import java.io.File
import java.nio.ByteBuffer
import java.util.UUID

class VideoCompressor(
  private val context: Context,
  private val uriString: String,
  private val targetBitrate: Int,
  private val maxSize: Int,
  private val codecPref: String,
  private val frameRateCap: Int,
  private val jobId: Int,
  private val onProgress: (Int, Double) -> Unit
) {
  companion object {
    private const val TAG = "BskyVideoCompress"
    private const val TIMEOUT_DEQUEUE = 100L
    private const val I_FRAME_INTERVAL = 3
  }

  @Volatile
  private var isCancelled = false

  fun cancel() {
    isCancelled = true
  }

  fun compress(): Map<String, Any> {
    // 'auto' targets h264 — server pipeline is HLS, which favors h264 (HEVC needs
    // fMP4 segments + commercial licensing). HEVC remains opt-in via codec: 'hevc'.
    val tryHevc = codecPref == "hevc"

    if (tryHevc) {
      try {
        return doCompress(useHevc = true, allowSoftwareFallback = false)
      } catch (e: Exception) {
        if (codecPref == "hevc" || isCancelled) throw e
        Log.w(TAG, "HEVC encode failed, falling back to h264", e)
      }
    }
    return doCompress(useHevc = false, allowSoftwareFallback = true)
  }

  private fun doCompress(useHevc: Boolean, allowSoftwareFallback: Boolean): Map<String, Any> {
    val mime = if (useHevc) MediaFormat.MIMETYPE_VIDEO_HEVC else MediaFormat.MIMETYPE_VIDEO_AVC
    val encoderInfo = CodecSelector.findEncoder(mime, requireHardware = !allowSoftwareFallback)
      ?: throw RuntimeException("No encoder for $mime")

    try {
      return runPipeline(encoderInfo, useHevc)
    } catch (e: Exception) {
      if (!allowSoftwareFallback || isCancelled || !encoderInfo.isHardware) throw e
      Log.w(TAG, "Hardware encoder ${encoderInfo.name} failed, trying software", e)
      val sw = CodecSelector.findEncoder(mime, requireHardware = false)
        ?.takeIf { !it.isHardware }
        ?: throw e
      return runPipeline(sw, useHevc)
    }
  }

  private fun runPipeline(
    encoderInfo: CodecSelector.EncoderInfo,
    useHevc: Boolean
  ): Map<String, Any> {
    val outputFile = File(context.cacheDir, "${UUID.randomUUID()}.mp4")

    var extractor: MediaExtractor? = null
    var muxer: MediaMuxer? = null
    var encoder: MediaCodec? = null
    var decoder: MediaCodec? = null
    var inputSurface: InputSurface? = null
    var outputSurface: OutputSurface? = null
    var muxerStarted = false
    var outputDims = Pair(0, 0)
    var durationUs = 0L

    try {
      val uri = Uri.parse(uriString)
      extractor = MediaExtractor()
      if (uriString.startsWith("content://") || uriString.startsWith("file://")) {
        extractor.setDataSource(context, uri, null)
      } else {
        extractor.setDataSource(uriString)
      }

      var videoTrackIndex = -1
      var audioTrackIndex = -1
      var videoFormat: MediaFormat? = null
      var audioFormat: MediaFormat? = null

      for (i in 0 until extractor.trackCount) {
        val format = extractor.getTrackFormat(i)
        val trackMime = format.getString(MediaFormat.KEY_MIME) ?: continue
        if (trackMime.startsWith("video/") && videoTrackIndex == -1) {
          videoTrackIndex = i
          videoFormat = format
        } else if (trackMime.startsWith("audio/") && audioTrackIndex == -1) {
          audioTrackIndex = i
          audioFormat = format
        }
      }

      if (videoTrackIndex == -1 || videoFormat == null) {
        throw RuntimeException("No video track found")
      }

      val sourceWidth = videoFormat.getInteger(MediaFormat.KEY_WIDTH)
      val sourceHeight = videoFormat.getInteger(MediaFormat.KEY_HEIGHT)
      val rotation = if (videoFormat.containsKey(MediaFormat.KEY_ROTATION)) {
        videoFormat.getInteger(MediaFormat.KEY_ROTATION)
      } else 0
      durationUs = if (videoFormat.containsKey(MediaFormat.KEY_DURATION)) {
        videoFormat.getLong(MediaFormat.KEY_DURATION)
      } else 0L
      val sourceFps = if (videoFormat.containsKey(MediaFormat.KEY_FRAME_RATE)) {
        videoFormat.getInteger(MediaFormat.KEY_FRAME_RATE)
      } else 30

      outputDims = calculateOutputDims(sourceWidth, sourceHeight, rotation, maxSize)
      val shouldPassthroughAudio = audioFormat != null && canPassthroughAudio(audioFormat)
      muxer = MediaMuxer(outputFile.absolutePath, MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4)

      val effectiveBitrate = if (targetBitrate > 0) {
        targetBitrate
      } else if (useHevc) 2_500_000 else 3_000_000

      val encoderFormat = MediaFormat.createVideoFormat(
        encoderInfo.mime, outputDims.first, outputDims.second
      ).apply {
        setInteger(
          MediaFormat.KEY_COLOR_FORMAT,
          MediaCodecInfo.CodecCapabilities.COLOR_FormatSurface
        )
        setInteger(MediaFormat.KEY_BIT_RATE, effectiveBitrate)
        setInteger(
          MediaFormat.KEY_BITRATE_MODE,
          MediaCodecInfo.EncoderCapabilities.BITRATE_MODE_CBR
        )
        setInteger(MediaFormat.KEY_FRAME_RATE, frameRateCap)
        setInteger(MediaFormat.KEY_I_FRAME_INTERVAL, I_FRAME_INTERVAL)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
          setInteger(MediaFormat.KEY_COLOR_STANDARD, MediaFormat.COLOR_STANDARD_BT709)
          setInteger(MediaFormat.KEY_COLOR_TRANSFER, MediaFormat.COLOR_TRANSFER_SDR_VIDEO)
          setInteger(MediaFormat.KEY_COLOR_RANGE, MediaFormat.COLOR_RANGE_LIMITED)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
          setInteger(MediaFormat.KEY_PRIORITY, 0)
          setInteger(MediaFormat.KEY_OPERATING_RATE, frameRateCap)
          if (useHevc) {
            setInteger(
              MediaFormat.KEY_PROFILE,
              MediaCodecInfo.CodecProfileLevel.HEVCProfileMain
            )
          } else {
            setInteger(
              MediaFormat.KEY_PROFILE,
              MediaCodecInfo.CodecProfileLevel.AVCProfileHigh
            )
            setInteger(
              MediaFormat.KEY_LEVEL,
              MediaCodecInfo.CodecProfileLevel.AVCLevel41
            )
          }
        }
      }

      encoder = MediaCodec.createByCodecName(encoderInfo.name)
      encoder.configure(encoderFormat, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE)
      val encoderInputSurface = encoder.createInputSurface()
      inputSurface = InputSurface(encoderInputSurface)
      inputSurface.makeCurrent()
      outputSurface = OutputSurface()
      encoder.start()

      decoder = MediaCodec.createDecoderByType(
        videoFormat.getString(MediaFormat.KEY_MIME) ?: "video/avc"
      )
      decoder.configure(videoFormat, outputSurface.surface, null, 0)
      decoder.start()
      extractor.selectTrack(videoTrackIndex)

      val frameDropEnabled = sourceFps > frameRateCap
      val targetFrameIntervalUs = if (frameDropEnabled) 1_000_000L / frameRateCap else 0L
      var nextTargetPtsUs = 0L

      var muxerVideoTrack = -1
      var muxerAudioTrack = -1

      val bufferInfo = MediaCodec.BufferInfo()
      var inputDone = false
      var decoderDone = false
      var outputDone = false
      var lastProgressMs = 0L

      while (!outputDone && !isCancelled) {
        if (!inputDone) {
          val idx = decoder.dequeueInputBuffer(TIMEOUT_DEQUEUE)
          if (idx >= 0) {
            val buf = decoder.getInputBuffer(idx)
            if (buf != null) {
              val sz = extractor.readSampleData(buf, 0)
              if (sz < 0) {
                decoder.queueInputBuffer(
                  idx, 0, 0, 0, MediaCodec.BUFFER_FLAG_END_OF_STREAM
                )
                inputDone = true
              } else {
                decoder.queueInputBuffer(idx, 0, sz, extractor.sampleTime, 0)
                extractor.advance()
              }
            }
          }
        }

        if (!decoderDone) {
          val status = decoder.dequeueOutputBuffer(bufferInfo, TIMEOUT_DEQUEUE)
          if (status >= 0) {
            val isEos = bufferInfo.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM != 0
            val shouldRender = if (isEos) {
              false
            } else if (frameDropEnabled) {
              if (bufferInfo.presentationTimeUs >= nextTargetPtsUs) {
                nextTargetPtsUs = bufferInfo.presentationTimeUs + targetFrameIntervalUs
                true
              } else false
            } else true
            decoder.releaseOutputBuffer(status, shouldRender)
            if (shouldRender) {
              outputSurface.awaitNewImage()
              outputSurface.drawImage()
              inputSurface.setPresentationTime(bufferInfo.presentationTimeUs * 1000)
              inputSurface.swapBuffers()
            }
            if (isEos) {
              encoder.signalEndOfInputStream()
              decoderDone = true
            }
          }
        }

        var encoderDrained = false
        while (!outputDone && !isCancelled && !encoderDrained) {
          val encIdx = encoder.dequeueOutputBuffer(bufferInfo, 0)
          when {
            encIdx == MediaCodec.INFO_TRY_AGAIN_LATER -> encoderDrained = true
            encIdx == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED -> {
              if (!muxerStarted) {
                muxerVideoTrack = muxer.addTrack(encoder.outputFormat)
                if (audioTrackIndex >= 0 && shouldPassthroughAudio && audioFormat != null) {
                  muxerAudioTrack = muxer.addTrack(audioFormat)
                }
                muxer.start()
                muxerStarted = true
              }
            }
            encIdx >= 0 -> {
              val data = encoder.getOutputBuffer(encIdx)
              if (bufferInfo.flags and MediaCodec.BUFFER_FLAG_CODEC_CONFIG != 0) {
                bufferInfo.size = 0
              }
              if (data != null && bufferInfo.size > 0 && muxerStarted) {
                muxer.writeSampleData(muxerVideoTrack, data, bufferInfo)
              }
              val isEos = bufferInfo.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM != 0
              encoder.releaseOutputBuffer(encIdx, false)
              if (isEos) {
                outputDone = true
              } else if (durationUs > 0) {
                val now = System.currentTimeMillis()
                if (now - lastProgressMs >= 100) {
                  lastProgressMs = now
                  val p = (bufferInfo.presentationTimeUs.toDouble() / durationUs)
                    .coerceIn(0.0, 1.0)
                  onProgress(jobId, p)
                }
              }
            }
          }
        }
      }

      if (audioTrackIndex >= 0 && muxerAudioTrack >= 0 && muxerStarted && !isCancelled) {
        passthroughAudio(audioTrackIndex, muxer, muxerAudioTrack)
      }
    } finally {
      try { decoder?.stop() } catch (_: Exception) {}
      try { decoder?.release() } catch (_: Exception) {}
      try { encoder?.stop() } catch (_: Exception) {}
      try { encoder?.release() } catch (_: Exception) {}
      try { outputSurface?.release() } catch (_: Exception) {}
      try { inputSurface?.release() } catch (_: Exception) {}
      try { extractor?.release() } catch (_: Exception) {}
      try {
        if (muxerStarted) muxer?.stop()
        muxer?.release()
      } catch (_: Exception) {}
    }

    if (isCancelled) {
      outputFile.delete()
      throw RuntimeException("Compression cancelled")
    }

    onProgress(jobId, 1.0)
    val durationSeconds = durationUs / 1_000_000.0

    return mapOf(
      "uri" to "file://${outputFile.absolutePath}",
      "size" to outputFile.length(),
      "mimeType" to "video/mp4",
      "width" to outputDims.first,
      "height" to outputDims.second,
      "duration" to durationSeconds,
      "codec" to if (useHevc) "hevc" else "h264"
    )
  }

  private fun passthroughAudio(audioTrackIndex: Int, muxer: MediaMuxer, muxerAudioTrack: Int) {
    val audioExtractor = MediaExtractor()
    if (uriString.startsWith("content://") || uriString.startsWith("file://")) {
      audioExtractor.setDataSource(context, Uri.parse(uriString), null)
    } else {
      audioExtractor.setDataSource(uriString)
    }
    audioExtractor.selectTrack(audioTrackIndex)
    audioExtractor.seekTo(0, MediaExtractor.SEEK_TO_CLOSEST_SYNC)

    val buffer = ByteBuffer.allocate(256 * 1024)
    val info = MediaCodec.BufferInfo()
    try {
      while (!isCancelled) {
        val sz = audioExtractor.readSampleData(buffer, 0)
        if (sz < 0) break
        info.offset = 0
        info.size = sz
        info.presentationTimeUs = audioExtractor.sampleTime
        info.flags = audioExtractor.sampleFlags
        muxer.writeSampleData(muxerAudioTrack, buffer, info)
        audioExtractor.advance()
      }
    } finally {
      audioExtractor.release()
    }
  }

  private fun canPassthroughAudio(format: MediaFormat): Boolean {
    val mime = format.getString(MediaFormat.KEY_MIME) ?: return false
    return mime == MediaFormat.MIMETYPE_AUDIO_AAC
  }

  private fun calculateOutputDims(srcW: Int, srcH: Int, rotation: Int, maxSize: Int): Pair<Int, Int> {
    val isRotated = rotation == 90 || rotation == 270
    val displayW = if (isRotated) srcH else srcW
    val displayH = if (isRotated) srcW else srcH
    val scale: Float = when {
      displayW <= maxSize && displayH <= maxSize -> 1.0f
      displayW > displayH -> maxSize.toFloat() / displayW
      else -> maxSize.toFloat() / displayH
    }
    return Pair(
      roundToEven((displayW * scale).toInt()),
      roundToEven((displayH * scale).toInt())
    )
  }

  private fun roundToEven(v: Int): Int = if (v % 2 == 0) v else v - 1
}
