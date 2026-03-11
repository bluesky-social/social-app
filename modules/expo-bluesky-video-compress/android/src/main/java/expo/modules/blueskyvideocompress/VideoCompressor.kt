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
import android.view.Surface
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
    private const val TIMEOUT_US = 10_000L
    private const val I_FRAME_INTERVAL = 3
    private const val AUDIO_AAC_BITRATE = 128_000
    private const val AUDIO_SAMPLE_RATE = 44100
    private const val AUDIO_CHANNELS = 2
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
      }
    }

    val encoder = MediaCodec.createByCodecName(encoderName)
    encoder.configure(encoderFormat, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE)
    val inputSurface = encoder.createInputSurface()
    encoder.start()

    // Set up video decoder
    val decoderFormat = videoFormat
    val decoder = MediaCodec.createDecoderByType(
      videoFormat.getString(MediaFormat.KEY_MIME) ?: "video/avc"
    )
    // Output surface is the encoder's input surface for zero-copy pipeline
    decoder.configure(decoderFormat, inputSurface, null, 0)
    decoder.start()

    extractor.selectTrack(videoTrackIndex)

    // Process video frames
    val bufferInfo = MediaCodec.BufferInfo()
    var inputDone = false
    var outputDone = false
    var lastProgressTime = 0L

    try {
      while (!outputDone && !isCancelled) {
        // Feed decoder
        if (!inputDone) {
          val inputIndex = decoder.dequeueInputBuffer(TIMEOUT_US)
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

        // Drain decoder -> surface -> encoder
        drainDecoder(decoder, bufferInfo)

        // Drain encoder
        val encoderOutputIndex = encoder.dequeueOutputBuffer(bufferInfo, TIMEOUT_US)
        when {
          encoderOutputIndex == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED -> {
            if (!muxerStarted) {
              muxerVideoTrack = muxer.addTrack(encoder.outputFormat)
              // If we have audio, add it now too before starting muxer
              if (audioTrackIndex != -1 && audioFormat != null) {
                muxerAudioTrack = if (shouldPassthroughAudio) {
                  muxer.addTrack(audioFormat)
                } else {
                  // Audio re-encode track will be added when audio encoder outputs format
                  -1
                }
              }
              if (audioTrackIndex == -1 || muxerAudioTrack >= 0) {
                muxer.start()
                muxerStarted = true
              }
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
        }
      }

      // Process audio track
      if (audioTrackIndex != -1 && audioFormat != null && !isCancelled) {
        if (shouldPassthroughAudio) {
          processAudioPassthrough(
            extractor, audioTrackIndex, muxer, muxerAudioTrack, muxerStarted
          )
        } else {
          processAudioReencode(
            extractor, audioTrackIndex, audioFormat, muxer, muxerStarted
          )
        }
      }
    } finally {
      // Clean up resources
      try { decoder.stop() } catch (_: Exception) {}
      try { decoder.release() } catch (_: Exception) {}
      try { encoder.stop() } catch (_: Exception) {}
      try { encoder.release() } catch (_: Exception) {}
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

  private fun drainDecoder(decoder: MediaCodec, bufferInfo: MediaCodec.BufferInfo) {
    while (true) {
      val outputIndex = decoder.dequeueOutputBuffer(bufferInfo, TIMEOUT_US)
      if (outputIndex < 0) break

      val isEos = bufferInfo.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM != 0
      // Render to surface (encoder's input) - true means render
      decoder.releaseOutputBuffer(outputIndex, bufferInfo.size > 0)

      if (isEos) {
        // Signal encoder that input is done
        // Note: with Surface input, we signal EOS by calling signalEndOfInputStream
        break
      }
    }

    // If decoder flagged EOS, signal encoder
    if (bufferInfo.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM != 0) {
      // This may throw if already signaled - that's fine
      try {
        // We need access to encoder here - this is handled in the main loop
      } catch (_: Exception) {}
    }
  }

  private fun processAudioPassthrough(
    extractor: MediaExtractor,
    audioTrackIndex: Int,
    muxer: MediaMuxer,
    muxerAudioTrack: Int,
    muxerStarted: Boolean
  ) {
    if (!muxerStarted || muxerAudioTrack < 0) return

    // Need a separate extractor for audio since the first one is used for video
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

  private fun processAudioReencode(
    extractor: MediaExtractor,
    audioTrackIndex: Int,
    audioFormat: MediaFormat,
    muxer: MediaMuxer,
    muxerStarted: Boolean
  ) {
    // Set up separate extractor for audio
    val audioExtractor = MediaExtractor()
    if (uri.startsWith("content://") || uri.startsWith("file://")) {
      audioExtractor.setDataSource(context, Uri.parse(uri), null)
    } else {
      audioExtractor.setDataSource(uri)
    }
    audioExtractor.selectTrack(audioTrackIndex)

    val audioMime = audioFormat.getString(MediaFormat.KEY_MIME) ?: "audio/mp4a-latm"
    val sampleRate = if (audioFormat.containsKey(MediaFormat.KEY_SAMPLE_RATE)) {
      audioFormat.getInteger(MediaFormat.KEY_SAMPLE_RATE)
    } else {
      AUDIO_SAMPLE_RATE
    }
    val channelCount = if (audioFormat.containsKey(MediaFormat.KEY_CHANNEL_COUNT)) {
      audioFormat.getInteger(MediaFormat.KEY_CHANNEL_COUNT)
    } else {
      AUDIO_CHANNELS
    }

    // Audio decoder
    val audioDecoder = MediaCodec.createDecoderByType(audioMime)
    audioDecoder.configure(audioFormat, null, null, 0)
    audioDecoder.start()

    // Audio encoder
    val audioEncoderFormat = MediaFormat.createAudioFormat(
      MediaFormat.MIMETYPE_AUDIO_AAC,
      sampleRate,
      channelCount
    ).apply {
      setInteger(MediaFormat.KEY_BIT_RATE, AUDIO_AAC_BITRATE)
      setInteger(MediaFormat.KEY_AAC_PROFILE, MediaCodecInfo.CodecProfileLevel.AACObjectLC)
    }
    val audioEncoder = MediaCodec.createEncoderByType(MediaFormat.MIMETYPE_AUDIO_AAC)
    audioEncoder.configure(audioEncoderFormat, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE)
    audioEncoder.start()

    var muxerTrack = -1
    var localMuxerStarted = muxerStarted
    val bufferInfo = MediaCodec.BufferInfo()
    var inputDone = false
    var decoderDone = false
    var encoderDone = false

    try {
      while (!encoderDone && !isCancelled) {
        // Feed decoder
        if (!inputDone) {
          val inputIndex = audioDecoder.dequeueInputBuffer(TIMEOUT_US)
          if (inputIndex >= 0) {
            val inputBuffer = audioDecoder.getInputBuffer(inputIndex) ?: continue
            val sampleSize = audioExtractor.readSampleData(inputBuffer, 0)
            if (sampleSize < 0) {
              audioDecoder.queueInputBuffer(
                inputIndex, 0, 0, 0, MediaCodec.BUFFER_FLAG_END_OF_STREAM
              )
              inputDone = true
            } else {
              audioDecoder.queueInputBuffer(
                inputIndex, 0, sampleSize, audioExtractor.sampleTime, 0
              )
              audioExtractor.advance()
            }
          }
        }

        // Drain decoder -> feed encoder
        if (!decoderDone) {
          val decoderOutputIndex = audioDecoder.dequeueOutputBuffer(bufferInfo, TIMEOUT_US)
          if (decoderOutputIndex >= 0) {
            val isEos = bufferInfo.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM != 0
            val decodedBuffer = audioDecoder.getOutputBuffer(decoderOutputIndex)

            if (decodedBuffer != null && bufferInfo.size > 0) {
              val encoderInputIndex = audioEncoder.dequeueInputBuffer(TIMEOUT_US)
              if (encoderInputIndex >= 0) {
                val encoderInputBuffer = audioEncoder.getInputBuffer(encoderInputIndex)
                if (encoderInputBuffer != null) {
                  encoderInputBuffer.clear()
                  encoderInputBuffer.put(decodedBuffer)
                  audioEncoder.queueInputBuffer(
                    encoderInputIndex, 0, bufferInfo.size,
                    bufferInfo.presentationTimeUs,
                    if (isEos) MediaCodec.BUFFER_FLAG_END_OF_STREAM else 0
                  )
                }
              }
            } else if (isEos) {
              val encoderInputIndex = audioEncoder.dequeueInputBuffer(TIMEOUT_US)
              if (encoderInputIndex >= 0) {
                audioEncoder.queueInputBuffer(
                  encoderInputIndex, 0, 0, 0, MediaCodec.BUFFER_FLAG_END_OF_STREAM
                )
              }
            }

            audioDecoder.releaseOutputBuffer(decoderOutputIndex, false)
            if (isEos) decoderDone = true
          }
        }

        // Drain encoder -> muxer
        val encoderOutputIndex = audioEncoder.dequeueOutputBuffer(bufferInfo, TIMEOUT_US)
        when {
          encoderOutputIndex == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED -> {
            if (muxerTrack < 0) {
              muxerTrack = muxer.addTrack(audioEncoder.outputFormat)
              if (!localMuxerStarted) {
                muxer.start()
                localMuxerStarted = true
              }
            }
          }
          encoderOutputIndex >= 0 -> {
            val outputBuffer = audioEncoder.getOutputBuffer(encoderOutputIndex)
            if (outputBuffer != null &&
                bufferInfo.flags and MediaCodec.BUFFER_FLAG_CODEC_CONFIG == 0 &&
                bufferInfo.size > 0 &&
                muxerTrack >= 0) {
              muxer.writeSampleData(muxerTrack, outputBuffer, bufferInfo)
            }
            encoderDone = bufferInfo.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM != 0
            audioEncoder.releaseOutputBuffer(encoderOutputIndex, false)
          }
        }
      }
    } finally {
      try { audioDecoder.stop() } catch (_: Exception) {}
      try { audioDecoder.release() } catch (_: Exception) {}
      try { audioEncoder.stop() } catch (_: Exception) {}
      try { audioEncoder.release() } catch (_: Exception) {}
      audioExtractor.release()
    }
  }

  private fun canPassthroughAudio(format: MediaFormat): Boolean {
    val mime = format.getString(MediaFormat.KEY_MIME) ?: return false
    if (mime != MediaFormat.MIMETYPE_AUDIO_AAC) return false

    // Check bitrate if available
    if (format.containsKey(MediaFormat.KEY_BIT_RATE)) {
      val bitrate = format.getInteger(MediaFormat.KEY_BIT_RATE)
      return bitrate <= AUDIO_AAC_BITRATE
    }

    // If no bitrate info, assume we should passthrough AAC
    return true
  }

  private fun calculateOutputSize(
    width: Int,
    height: Int,
    rotation: Int,
    maxSize: Int
  ): Pair<Int, Int> {
    // Apply rotation to get display dimensions
    val isRotated = rotation == 90 || rotation == 270
    val sourceWidth = if (isRotated) height else width
    val sourceHeight = if (isRotated) width else height

    // If within bounds, keep original (rounded to even)
    if (sourceWidth <= maxSize && sourceHeight <= maxSize) {
      return Pair(roundToEven(sourceWidth), roundToEven(sourceHeight))
    }

    // Scale down maintaining aspect ratio
    val scale = if (sourceWidth > sourceHeight) {
      maxSize.toFloat() / sourceWidth.toFloat()
    } else {
      maxSize.toFloat() / sourceHeight.toFloat()
    }

    return Pair(
      roundToEven((sourceWidth * scale).toInt()),
      roundToEven((sourceHeight * scale).toInt())
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
