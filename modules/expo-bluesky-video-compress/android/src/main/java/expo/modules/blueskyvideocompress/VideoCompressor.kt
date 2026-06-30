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
      val transcodedAudio: TranscodedAudio? = if (
        audioTrackIndex >= 0 && audioFormat != null && !shouldPassthroughAudio
      ) {
        transcodeAudioToAAC(audioTrackIndex, audioFormat)
      } else null
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
      // Ask the decoder to tone-map HDR (HLG/PQ) sources to SDR. Vendors may
      // ignore the hint, but where supported it produces correct BT.709 pixels
      // for the encoder rather than HDR pixels mislabeled as SDR.
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        videoFormat.setInteger(
          MediaFormat.KEY_COLOR_TRANSFER_REQUEST,
          MediaFormat.COLOR_TRANSFER_SDR_VIDEO
        )
      }
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
                if (audioTrackIndex >= 0 && audioFormat != null) {
                  if (shouldPassthroughAudio) {
                    muxerAudioTrack = muxer.addTrack(audioFormat)
                  } else if (transcodedAudio != null) {
                    muxerAudioTrack = muxer.addTrack(transcodedAudio.outputFormat)
                  }
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
        if (shouldPassthroughAudio) {
          passthroughAudio(audioTrackIndex, muxer, muxerAudioTrack)
        } else if (transcodedAudio != null) {
          writeTranscodedAudio(transcodedAudio.samples, muxer, muxerAudioTrack)
        }
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

  private data class TranscodedAudio(
    val outputFormat: MediaFormat,
    val samples: List<Sample>
  ) {
    data class Sample(
      val bytes: ByteArray,
      val presentationTimeUs: Long,
      val flags: Int
    )
  }

  // Re-encode non-AAC source audio (Opus, Vorbis, etc.) to AAC so the mp4 muxer
  // can take it. iOS always re-encodes to AAC; without this Android would drop
  // the audio track entirely.
  private fun transcodeAudioToAAC(
    audioTrackIndex: Int,
    sourceFormat: MediaFormat
  ): TranscodedAudio? {
    val sourceMime = sourceFormat.getString(MediaFormat.KEY_MIME) ?: return null
    val sampleRate = if (sourceFormat.containsKey(MediaFormat.KEY_SAMPLE_RATE))
      sourceFormat.getInteger(MediaFormat.KEY_SAMPLE_RATE) else 44100
    val channelCount = if (sourceFormat.containsKey(MediaFormat.KEY_CHANNEL_COUNT))
      sourceFormat.getInteger(MediaFormat.KEY_CHANNEL_COUNT).coerceIn(1, 2) else 2

    val audioExtractor = MediaExtractor()
    if (uriString.startsWith("content://") || uriString.startsWith("file://")) {
      audioExtractor.setDataSource(context, Uri.parse(uriString), null)
    } else {
      audioExtractor.setDataSource(uriString)
    }
    audioExtractor.selectTrack(audioTrackIndex)

    var decoder: MediaCodec? = null
    var encoder: MediaCodec? = null
    try {
      decoder = MediaCodec.createDecoderByType(sourceMime)
      decoder.configure(sourceFormat, null, null, 0)
      decoder.start()

      val encoderFormat = MediaFormat.createAudioFormat(
        MediaFormat.MIMETYPE_AUDIO_AAC, sampleRate, channelCount
      ).apply {
        setInteger(
          MediaFormat.KEY_AAC_PROFILE,
          MediaCodecInfo.CodecProfileLevel.AACObjectLC
        )
        setInteger(MediaFormat.KEY_BIT_RATE, 128_000)
        setInteger(MediaFormat.KEY_MAX_INPUT_SIZE, 256 * 1024)
      }
      encoder = MediaCodec.createEncoderByType(MediaFormat.MIMETYPE_AUDIO_AAC)
      encoder.configure(encoderFormat, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE)
      encoder.start()

      val samples = mutableListOf<TranscodedAudio.Sample>()
      var outputFormat: MediaFormat? = null
      var inputDone = false
      var decoderDone = false
      var encoderInputSignalled = false
      var encoderDone = false
      val info = MediaCodec.BufferInfo()

      while (!encoderDone && !isCancelled) {
        if (!inputDone) {
          val idx = decoder.dequeueInputBuffer(TIMEOUT_DEQUEUE)
          if (idx >= 0) {
            val buf = decoder.getInputBuffer(idx)
            if (buf != null) {
              val sz = audioExtractor.readSampleData(buf, 0)
              if (sz < 0) {
                decoder.queueInputBuffer(
                  idx, 0, 0, 0, MediaCodec.BUFFER_FLAG_END_OF_STREAM
                )
                inputDone = true
              } else {
                decoder.queueInputBuffer(
                  idx, 0, sz, audioExtractor.sampleTime, audioExtractor.sampleFlags
                )
                audioExtractor.advance()
              }
            }
          }
        }

        if (!decoderDone) {
          val status = decoder.dequeueOutputBuffer(info, TIMEOUT_DEQUEUE)
          when {
            status == MediaCodec.INFO_TRY_AGAIN_LATER -> {}
            status == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED -> {}
            status >= 0 -> {
              val isEos = info.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM != 0
              val data = decoder.getOutputBuffer(status)
              if (data != null && info.size > 0) {
                val encInIdx = encoder.dequeueInputBuffer(TIMEOUT_DEQUEUE)
                if (encInIdx >= 0) {
                  val encInBuf = encoder.getInputBuffer(encInIdx)
                  if (encInBuf != null) {
                    encInBuf.clear()
                    data.position(info.offset)
                    data.limit(info.offset + info.size)
                    encInBuf.put(data)
                    encoder.queueInputBuffer(
                      encInIdx, 0, info.size, info.presentationTimeUs, 0
                    )
                  }
                }
              }
              decoder.releaseOutputBuffer(status, false)
              if (isEos) {
                if (!encoderInputSignalled) {
                  val encInIdx = encoder.dequeueInputBuffer(TIMEOUT_DEQUEUE * 10)
                  if (encInIdx >= 0) {
                    encoder.queueInputBuffer(
                      encInIdx, 0, 0, 0, MediaCodec.BUFFER_FLAG_END_OF_STREAM
                    )
                    encoderInputSignalled = true
                  }
                }
                decoderDone = true
              }
            }
          }
        }

        val encOutIdx = encoder.dequeueOutputBuffer(info, TIMEOUT_DEQUEUE)
        when {
          encOutIdx == MediaCodec.INFO_TRY_AGAIN_LATER -> {}
          encOutIdx == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED -> {
            outputFormat = encoder.outputFormat
          }
          encOutIdx >= 0 -> {
            val data = encoder.getOutputBuffer(encOutIdx)
            val isEos = info.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM != 0
            val isConfig = info.flags and MediaCodec.BUFFER_FLAG_CODEC_CONFIG != 0
            if (data != null && info.size > 0 && !isConfig) {
              val bytes = ByteArray(info.size)
              data.position(info.offset)
              data.get(bytes, 0, info.size)
              samples.add(
                TranscodedAudio.Sample(
                  bytes = bytes,
                  presentationTimeUs = info.presentationTimeUs,
                  flags = info.flags and MediaCodec.BUFFER_FLAG_CODEC_CONFIG.inv()
                )
              )
            }
            encoder.releaseOutputBuffer(encOutIdx, false)
            if (isEos) encoderDone = true
          }
        }
      }

      val fmt = outputFormat ?: return null
      return TranscodedAudio(fmt, samples)
    } catch (e: Exception) {
      Log.w(TAG, "Audio transcode failed; dropping audio", e)
      return null
    } finally {
      try { decoder?.stop() } catch (_: Exception) {}
      try { decoder?.release() } catch (_: Exception) {}
      try { encoder?.stop() } catch (_: Exception) {}
      try { encoder?.release() } catch (_: Exception) {}
      audioExtractor.release()
    }
  }

  private fun writeTranscodedAudio(
    samples: List<TranscodedAudio.Sample>,
    muxer: MediaMuxer,
    muxerAudioTrack: Int
  ) {
    val info = MediaCodec.BufferInfo()
    for (sample in samples) {
      if (isCancelled) break
      val buffer = ByteBuffer.wrap(sample.bytes)
      info.offset = 0
      info.size = sample.bytes.size
      info.presentationTimeUs = sample.presentationTimeUs
      info.flags = sample.flags
      muxer.writeSampleData(muxerAudioTrack, buffer, info)
    }
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
