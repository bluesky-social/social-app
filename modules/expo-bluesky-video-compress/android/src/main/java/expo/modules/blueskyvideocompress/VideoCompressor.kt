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

class VideoCompressor(
  private val context: Context,
  private val uri: String,
  private val targetBitrate: Int,
  private val maxSize: Int,
  private val jobId: Int,
  private val onProgress: (Int, Double) -> Unit
) {
  companion object {
    private const val TAG = "VideoCompressor"
    private const val TIMEOUT_DEQUEUE = 100L // 100us
    private const val I_FRAME_INTERVAL = 3
  }

  @Volatile
  private var isCancelled = false

  fun cancel() {
    isCancelled = true
  }

  fun compress(): Map<String, Any> {
    val encoderInfo = CodecSelector.selectEncoder()
    Log.d(TAG, "Using encoder: ${encoderInfo.name}")

    try {
      return doCompress(encoderInfo.name)
    } catch (e: Exception) {
      // If hardware encoder failed, retry with software fallback
      if (encoderInfo.isHardware && !isCancelled) {
        Log.w(TAG, "Hardware encoding failed, trying software fallback", e)
        try {
          val softwareEncoder = findSoftwareEncoder()
          if (softwareEncoder != null) {
            return doCompress(softwareEncoder)
          }
        } catch (e2: Exception) {
          Log.e(TAG, "Software fallback also failed", e2)
        }
      }
      throw e
    }
  }

  private fun doCompress(encoderName: String): Map<String, Any> {
    val parsedUri = Uri.parse(uri)

    // Set up extractor
    val extractor = MediaExtractor()
    if (uri.startsWith("content://") || uri.startsWith("file://")) {
      extractor.setDataSource(context, parsedUri, null)
    } else {
      extractor.setDataSource(uri)
    }

    // Find video and audio tracks
    var videoTrackIndex = -1
    var audioTrackIndex = -1
    var videoFormat: MediaFormat? = null
    var audioFormat: MediaFormat? = null

    for (i in 0 until extractor.trackCount) {
      val format = extractor.getTrackFormat(i)
      val mime = format.getString(MediaFormat.KEY_MIME) ?: continue
      if (mime.startsWith("video/") && videoTrackIndex == -1) {
        videoTrackIndex = i
        videoFormat = format
      } else if (mime.startsWith("audio/") && audioTrackIndex == -1) {
        audioTrackIndex = i
        audioFormat = format
      }
    }

    if (videoTrackIndex == -1 || videoFormat == null) {
      extractor.release()
      throw RuntimeException("No video track found")
    }

    // Get source video properties
    val sourceWidth = videoFormat.getInteger(MediaFormat.KEY_WIDTH)
    val sourceHeight = videoFormat.getInteger(MediaFormat.KEY_HEIGHT)
    val rotation = if (videoFormat.containsKey(MediaFormat.KEY_ROTATION)) {
      videoFormat.getInteger(MediaFormat.KEY_ROTATION)
    } else {
      0
    }
    val durationUs = if (videoFormat.containsKey(MediaFormat.KEY_DURATION)) {
      videoFormat.getLong(MediaFormat.KEY_DURATION)
    } else {
      0L
    }
    val frameRate = if (videoFormat.containsKey(MediaFormat.KEY_FRAME_RATE)) {
      videoFormat.getInteger(MediaFormat.KEY_FRAME_RATE)
    } else {
      30
    }

    // Calculate output size
    val outputSize = calculateOutputSize(sourceWidth, sourceHeight, rotation, maxSize)

    // Determine audio passthrough
    val shouldPassthroughAudio = audioFormat != null && canPassthroughAudio(audioFormat)

    // Output file
    val outputFile = File(context.cacheDir, "${System.currentTimeMillis()}.mp4")

    // Set up muxer
    val muxer = MediaMuxer(outputFile.absolutePath, MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4)

    // Set rotation on the muxer (not in the encoded video)
    if (rotation != 0) {
      muxer.setOrientationHint(rotation)
    }

    var muxerVideoTrack = -1
    var muxerAudioTrack = -1
    var muxerStarted = false

    // Set up video encoder
    val encoderFormat = MediaFormat.createVideoFormat(
      MediaFormat.MIMETYPE_VIDEO_AVC,
      outputSize.first,
      outputSize.second
    ).apply {
      setInteger(MediaFormat.KEY_BIT_RATE, targetBitrate)
      setInteger(MediaFormat.KEY_FRAME_RATE, frameRate.coerceAtMost(30))
      setInteger(MediaFormat.KEY_I_FRAME_INTERVAL, I_FRAME_INTERVAL)
      setInteger(
        MediaFormat.KEY_COLOR_FORMAT,
        MediaCodecInfo.CodecCapabilities.COLOR_FormatSurface
      )
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        setInteger(
          MediaFormat.KEY_PROFILE,
          MediaCodecInfo.CodecProfileLevel.AVCProfileHigh
        )
        setInteger(
          MediaFormat.KEY_LEVEL,
          MediaCodecInfo.CodecProfileLevel.AVCLevel41
        )
        setInteger(MediaFormat.KEY_PRIORITY, 0) // realtime
        setInteger(MediaFormat.KEY_OPERATING_RATE, Short.MAX_VALUE.toInt()) // max speed
      }
    }

    val encoder = MediaCodec.createByCodecName(encoderName)
    encoder.configure(encoderFormat, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE)

    // GL pipeline: Decoder -> SurfaceTexture -> OpenGL ES 2.0 -> EGL Surface -> Encoder
    val inputSurface = InputSurface(encoder.createInputSurface())
    inputSurface.makeCurrent()
    val outputSurface = OutputSurface()

    encoder.start()

    // Set up video decoder
    // Strip rotation from decoder format so the decoder outputs frames in storage
    // orientation. Some decoders apply rotation themselves when KEY_ROTATION is set,
    // which double-rotates since we handle it via muxer.setOrientationHint().
    if (videoFormat.containsKey(MediaFormat.KEY_ROTATION)) {
      videoFormat.setInteger(MediaFormat.KEY_ROTATION, 0)
    }
    val decoder = MediaCodec.createDecoderByType(
      videoFormat.getString(MediaFormat.KEY_MIME) ?: "video/avc"
    )
    decoder.configure(videoFormat, outputSurface.surface, null, 0)
    decoder.start()

    extractor.selectTrack(videoTrackIndex)

    // Frame rate capping: drop frames above 30fps
    val targetFps = frameRate.coerceAtMost(30)
    val frameIntervalUs = 1_000_000L / targetFps

    // Process video frames
    val bufferInfo = MediaCodec.BufferInfo()
    var inputDone = false
    var decoderDone = false
    var outputDone = false
    var lastProgressTime = 0L
    var lastRenderedPtsUs = -1L

    try {
      while (!outputDone && !isCancelled) {
        // Feed decoder
        if (!inputDone) {
          val inputIndex = decoder.dequeueInputBuffer(TIMEOUT_DEQUEUE)
          if (inputIndex >= 0) {
            val inputBuffer = decoder.getInputBuffer(inputIndex) ?: continue
            val sampleSize = extractor.readSampleData(inputBuffer, 0)
            if (sampleSize < 0) {
              decoder.queueInputBuffer(
                inputIndex, 0, 0, 0,
                MediaCodec.BUFFER_FLAG_END_OF_STREAM
              )
              inputDone = true
            } else {
              decoder.queueInputBuffer(
                inputIndex, 0, sampleSize,
                extractor.sampleTime, 0
              )
              extractor.advance()
            }
          }
        }

        // Drain decoder -> GL pipeline -> encoder
        if (!decoderDone) {
          decoderDone = drainDecoder(
            decoder, encoder, inputSurface, outputSurface,
            bufferInfo, frameIntervalUs, lastRenderedPtsUs
          ) { pts -> lastRenderedPtsUs = pts }
        }

        // Drain all available encoder output
        while (!outputDone && !isCancelled) {
          val encoderOutputIndex = encoder.dequeueOutputBuffer(bufferInfo, TIMEOUT_DEQUEUE)
          when {
            encoderOutputIndex == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED -> {
              if (!muxerStarted) {
                muxerVideoTrack = muxer.addTrack(encoder.outputFormat)
                // Add audio track for passthrough (format known upfront)
                if (audioTrackIndex != -1 && audioFormat != null && shouldPassthroughAudio) {
                  muxerAudioTrack = muxer.addTrack(audioFormat)
                }
                muxer.start()
                muxerStarted = true
              }
            }
            encoderOutputIndex >= 0 -> {
              val outputBuffer = encoder.getOutputBuffer(encoderOutputIndex)
              if (outputBuffer != null &&
                  bufferInfo.flags and MediaCodec.BUFFER_FLAG_CODEC_CONFIG == 0 &&
                  bufferInfo.size > 0 &&
                  muxerStarted) {
                muxer.writeSampleData(muxerVideoTrack, outputBuffer, bufferInfo)
              }

              val isEos = bufferInfo.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM != 0
              encoder.releaseOutputBuffer(encoderOutputIndex, false)

              if (isEos) {
                outputDone = true
              }

              // Progress reporting
              if (durationUs > 0) {
                val now = System.currentTimeMillis()
                if (now - lastProgressTime >= 100) {
                  lastProgressTime = now
                  val progress = (bufferInfo.presentationTimeUs.toDouble() / durationUs)
                    .coerceIn(0.0, 1.0)
                  onProgress(jobId, progress)
                }
              }
            }
            else -> break // No more encoder output available right now
          }
        }
      }

      // Process audio track (passthrough only — non-AAC audio is skipped)
      if (muxerAudioTrack >= 0 && muxerStarted && !isCancelled) {
        processAudioPassthrough(
          audioTrackIndex, muxer, muxerAudioTrack
        )
      }
    } finally {
      // Clean up resources
      try { decoder.stop() } catch (_: Exception) {}
      try { decoder.release() } catch (_: Exception) {}
      try { encoder.stop() } catch (_: Exception) {}
      try { encoder.release() } catch (_: Exception) {}
      try { outputSurface.release() } catch (_: Exception) {}
      try { inputSurface.release() } catch (_: Exception) {}
      try { extractor.release() } catch (_: Exception) {}
      try {
        if (muxerStarted) muxer.stop()
        muxer.release()
      } catch (_: Exception) {}
    }

    if (isCancelled) {
      outputFile.delete()
      throw RuntimeException("Compression cancelled")
    }

    val fileSize = outputFile.length()
    val durationSeconds = durationUs / 1_000_000.0

    return mapOf(
      "uri" to "file://${outputFile.absolutePath}",
      "size" to fileSize,
      "mimeType" to "video/mp4",
      "width" to outputSize.first,
      "height" to outputSize.second,
      "duration" to durationSeconds
    )
  }

  /**
   * Drains decoded frames through the GL pipeline to the encoder.
   * Drops frames to cap at the target frame rate.
   *
   * @return true if the decoder signaled EOS (all frames decoded)
   */
  private fun drainDecoder(
    decoder: MediaCodec,
    encoder: MediaCodec,
    inputSurface: InputSurface,
    outputSurface: OutputSurface,
    bufferInfo: MediaCodec.BufferInfo,
    frameIntervalUs: Long,
    lastRenderedPtsUs: Long,
    onRendered: (Long) -> Unit
  ): Boolean {
    var currentLastPts = lastRenderedPtsUs

    while (true) {
      val outputIndex = decoder.dequeueOutputBuffer(bufferInfo, TIMEOUT_DEQUEUE)
      if (outputIndex < 0) break

      val isEos = bufferInfo.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM != 0

      if (!isEos) {
        // Frame rate capping: decide whether to render or drop this frame
        val shouldRender = if (currentLastPts < 0) {
          true
        } else {
          bufferInfo.presentationTimeUs - currentLastPts >= frameIntervalUs
        }

        if (shouldRender && bufferInfo.size > 0) {
          // Render through GL pipeline: decoder -> SurfaceTexture -> GL -> encoder
          decoder.releaseOutputBuffer(outputIndex, true)
          outputSurface.awaitNewImage()
          outputSurface.drawImage()
          inputSurface.setPresentationTime(bufferInfo.presentationTimeUs * 1000)
          inputSurface.swapBuffers()
          currentLastPts = bufferInfo.presentationTimeUs
          onRendered(currentLastPts)
        } else {
          // Drop frame (don't render to surface)
          decoder.releaseOutputBuffer(outputIndex, false)
        }
      } else {
        decoder.releaseOutputBuffer(outputIndex, false)
        encoder.signalEndOfInputStream()
        return true
      }
    }
    return false
  }

  private fun processAudioPassthrough(
    audioTrackIndex: Int,
    muxer: MediaMuxer,
    muxerAudioTrack: Int
  ) {
    // Need a separate extractor for audio since the first one was used for video
    val audioExtractor = MediaExtractor()
    if (uri.startsWith("content://") || uri.startsWith("file://")) {
      audioExtractor.setDataSource(context, Uri.parse(uri), null)
    } else {
      audioExtractor.setDataSource(uri)
    }
    audioExtractor.selectTrack(audioTrackIndex)

    val buffer = ByteBuffer.allocate(1024 * 1024) // 1MB buffer
    val info = MediaCodec.BufferInfo()

    try {
      while (!isCancelled) {
        val sampleSize = audioExtractor.readSampleData(buffer, 0)
        if (sampleSize < 0) break

        info.offset = 0
        info.size = sampleSize
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
    // Always passthrough AAC regardless of bitrate — the server re-encodes
    // everything anyway, and re-encoding audio here complicates muxer startup
    // (MediaMuxer needs all tracks added before start(), but audio encoder
    // output format isn't known until it produces FORMAT_CHANGED).
    return mime == MediaFormat.MIMETYPE_AUDIO_AAC
  }

  private fun calculateOutputSize(
    width: Int,
    height: Int,
    rotation: Int,
    maxSize: Int
  ): Pair<Int, Int> {
    // Use display dimensions (rotated) to determine the scale factor,
    // but return storage dimensions (unrotated) for the encoder.
    // The muxer's orientationHint handles rotation separately.
    val isRotated = rotation == 90 || rotation == 270
    val displayWidth = if (isRotated) height else width
    val displayHeight = if (isRotated) width else height

    // If display dimensions within bounds, keep original storage size (rounded to even)
    if (displayWidth <= maxSize && displayHeight <= maxSize) {
      return Pair(roundToEven(width), roundToEven(height))
    }

    // Scale based on display dimensions
    val scale = if (displayWidth > displayHeight) {
      maxSize.toFloat() / displayWidth.toFloat()
    } else {
      maxSize.toFloat() / displayHeight.toFloat()
    }

    // Return storage dimensions (unrotated)
    return Pair(
      roundToEven((width * scale).toInt()),
      roundToEven((height * scale).toInt())
    )
  }

  private fun roundToEven(value: Int): Int {
    return if (value % 2 == 0) value else value - 1
  }

  private fun findSoftwareEncoder(): String? {
    return try {
      CodecSelector.selectSoftwareEncoder()?.name
    } catch (_: Exception) {
      null
    }
  }
}
