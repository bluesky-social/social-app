import AVFoundation
import VideoToolbox

class VideoCompressor {
  private let url: URL
  private let targetBitrate: Int
  private let maxSize: Int
  private let codecPref: String
  private let frameRateCap: Int
  private let jobId: Int
  private let onProgress: (Int, Double) -> Void
  private var isCancelled = false

  init(
    url: URL,
    targetBitrate: Int,
    maxSize: Int,
    codecPref: String,
    frameRateCap: Int,
    jobId: Int,
    onProgress: @escaping (Int, Double) -> Void
  ) {
    self.url = url
    self.targetBitrate = targetBitrate
    self.maxSize = maxSize
    self.codecPref = codecPref
    self.frameRateCap = frameRateCap
    self.jobId = jobId
    self.onProgress = onProgress
  }

  func cancel() {
    isCancelled = true
  }

  func compress() async throws -> [String: Any] {
    let asset = AVURLAsset(
      url: url,
      options: [AVURLAssetPreferPreciseDurationAndTimingKey: true]
    )
    let duration = try await asset.load(.duration)
    let totalSeconds = CMTimeGetSeconds(duration)
    guard totalSeconds > 0 else { throw err("Invalid video duration", code: 2) }

    let videoTracks = try await asset.loadTracks(withMediaType: .video)
    guard let videoTrack = videoTracks.first else {
      throw err("No video track found", code: 1)
    }

    let naturalSize = try await videoTrack.load(.naturalSize)
    let preferredTransform = try await videoTrack.load(.preferredTransform)

    let rotatedRect = CGRect(origin: .zero, size: naturalSize).applying(preferredTransform)
    let displaySize = CGSize(
      width: abs(rotatedRect.width),
      height: abs(rotatedRect.height)
    )
    let outputSize = scaleEvenly(displaySize: displaySize, maxSize: maxSize)

    let audioTracks = try await asset.loadTracks(withMediaType: .audio)

    // 'auto' targets h264 — server pipeline is HLS, which favors h264 (HEVC needs
    // fMP4 segments + commercial licensing). HEVC remains opt-in via codec: 'hevc'.
    let useHEVC: Bool
    switch codecPref {
    case "hevc": useHEVC = true
    default: useHEVC = false
    }
    let codecType: AVVideoCodecType = useHEVC ? .hevc : .h264
    let profileLevel: String = useHEVC
      ? kVTProfileLevel_HEVC_Main_AutoLevel as String
      : kVTProfileLevel_H264_High_AutoLevel as String

    let effectiveBitrate = targetBitrate > 0
      ? targetBitrate
      : (useHEVC ? 2_500_000 : 3_000_000)

    let outputURL = FileManager.default.temporaryDirectory
      .appendingPathComponent(UUID().uuidString)
      .appendingPathExtension("mp4")

    let videoComposition = makeRotatingComposition(
      videoTrack: videoTrack,
      preferredTransform: preferredTransform,
      naturalSize: naturalSize,
      outputSize: outputSize,
      duration: duration
    )

    let reader = try AVAssetReader(asset: asset)

    let videoReaderSettings: [String: Any] = [
      kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA
    ]
    let videoReaderOutput = AVAssetReaderVideoCompositionOutput(
      videoTracks: [videoTrack],
      videoSettings: videoReaderSettings
    )
    videoReaderOutput.videoComposition = videoComposition
    videoReaderOutput.alwaysCopiesSampleData = false
    guard reader.canAdd(videoReaderOutput) else {
      throw err("Cannot read video track", code: 3)
    }
    reader.add(videoReaderOutput)

    var compressionProps: [String: Any] = [
      AVVideoAverageBitRateKey: effectiveBitrate,
      AVVideoProfileLevelKey: profileLevel,
      AVVideoMaxKeyFrameIntervalKey: max(frameRateCap * 3, 30),
      AVVideoExpectedSourceFrameRateKey: frameRateCap,
      AVVideoAllowFrameReorderingKey: false,
      kVTCompressionPropertyKey_RealTime as String: true,
    ]
    let peakBytesPerSecond = Int(Double(effectiveBitrate) / 8.0 * 1.5)
    compressionProps[kVTCompressionPropertyKey_DataRateLimits as String] = [
      peakBytesPerSecond, 1.0
    ] as CFArray

    let videoColorProps: [String: Any] = [
      AVVideoColorPrimariesKey: AVVideoColorPrimaries_ITU_R_709_2,
      AVVideoTransferFunctionKey: AVVideoTransferFunction_ITU_R_709_2,
      AVVideoYCbCrMatrixKey: AVVideoYCbCrMatrix_ITU_R_709_2,
    ]

    let videoWriterSettings: [String: Any] = [
      AVVideoCodecKey: codecType,
      AVVideoWidthKey: outputSize.width,
      AVVideoHeightKey: outputSize.height,
      AVVideoColorPropertiesKey: videoColorProps,
      AVVideoCompressionPropertiesKey: compressionProps,
    ]
    let videoWriterInput = AVAssetWriterInput(
      mediaType: .video,
      outputSettings: videoWriterSettings
    )
    videoWriterInput.expectsMediaDataInRealTime = false

    let writer = try AVAssetWriter(outputURL: outputURL, fileType: .mp4)
    writer.shouldOptimizeForNetworkUse = true
    writer.metadata = []
    guard writer.canAdd(videoWriterInput) else {
      throw err("Cannot write video track", code: 4)
    }
    writer.add(videoWriterInput)

    var audioReaderOutput: AVAssetReaderTrackOutput?
    var audioWriterInput: AVAssetWriterInput?
    if let audioTrack = audioTracks.first {
      let audioDecoderSettings: [String: Any] = [
        AVFormatIDKey: kAudioFormatLinearPCM,
        AVLinearPCMBitDepthKey: 16,
        AVLinearPCMIsFloatKey: false,
        AVLinearPCMIsBigEndianKey: false,
        AVLinearPCMIsNonInterleaved: false,
      ]
      let audioOutput = AVAssetReaderTrackOutput(
        track: audioTrack,
        outputSettings: audioDecoderSettings
      )
      audioOutput.alwaysCopiesSampleData = false
      if reader.canAdd(audioOutput) {
        reader.add(audioOutput)
        audioReaderOutput = audioOutput

        let audioEncoderSettings: [String: Any] = [
          AVFormatIDKey: kAudioFormatMPEG4AAC,
          AVSampleRateKey: 44100,
          AVNumberOfChannelsKey: 2,
          AVEncoderBitRateKey: 128_000,
        ]
        let audioInput = AVAssetWriterInput(
          mediaType: .audio,
          outputSettings: audioEncoderSettings
        )
        audioInput.expectsMediaDataInRealTime = false
        if writer.canAdd(audioInput) {
          writer.add(audioInput)
          audioWriterInput = audioInput
        }
      }
    }

    guard reader.startReading() else {
      throw reader.error ?? err("Reader failed to start", code: 8)
    }
    guard writer.startWriting() else {
      throw writer.error ?? err("Writer failed to start", code: 9)
    }
    writer.startSession(atSourceTime: .zero)

    let minFrameIntervalSeconds = 1.0 / Double(frameRateCap)
    let minFrameInterval = CMTime(
      seconds: minFrameIntervalSeconds,
      preferredTimescale: 600
    )

    await withTaskGroup(of: Void.self) { group in
      group.addTask { [self] in
        await processVideoTrack(
          readerOutput: videoReaderOutput,
          writerInput: videoWriterInput,
          totalDuration: totalSeconds,
          minFrameInterval: minFrameInterval
        )
      }
      if let audioOutput = audioReaderOutput, let audioInput = audioWriterInput {
        group.addTask { [self] in
          await processAudioTrack(
            readerOutput: audioOutput,
            writerInput: audioInput
          )
        }
      }
      await group.waitForAll()
    }

    if isCancelled {
      writer.cancelWriting()
      try? FileManager.default.removeItem(at: outputURL)
      throw err("Compression cancelled", code: 5)
    }

    if reader.status == .failed {
      let error = reader.error ?? err("Reader failed", code: 6)
      writer.cancelWriting()
      try? FileManager.default.removeItem(at: outputURL)
      throw error
    }

    await writer.finishWriting()

    if writer.status == .failed {
      let error = writer.error ?? err("Writer failed", code: 7)
      try? FileManager.default.removeItem(at: outputURL)
      throw error
    }

    onProgress(jobId, 1.0)

    let attributes = try FileManager.default.attributesOfItem(atPath: outputURL.path)
    let fileSize = attributes[.size] as? Int ?? 0

    return [
      "uri": outputURL.absoluteString,
      "size": fileSize,
      "mimeType": "video/mp4",
      "width": outputSize.width,
      "height": outputSize.height,
      "duration": totalSeconds,
      "codec": useHEVC ? "hevc" : "h264",
    ]
  }

  private func processVideoTrack(
    readerOutput: AVAssetReaderOutput,
    writerInput: AVAssetWriterInput,
    totalDuration: Double,
    minFrameInterval: CMTime
  ) async {
    var lastProgressTime: CFAbsoluteTime = 0
    var lastAppendedPTS: CMTime?
    var finished = false

    await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
      writerInput.requestMediaDataWhenReady(
        on: DispatchQueue(label: "com.bsky.videocompress.video")
      ) {
        let finish = {
          if !finished {
            finished = true
            writerInput.markAsFinished()
            continuation.resume()
          }
        }
        while writerInput.isReadyForMoreMediaData {
          if finished { return }
          if self.isCancelled {
            finish()
            return
          }
          guard let sampleBuffer = readerOutput.copyNextSampleBuffer() else {
            finish()
            return
          }

          let pts = CMSampleBufferGetPresentationTimeStamp(sampleBuffer)
          if let last = lastAppendedPTS {
            let delta = CMTimeSubtract(pts, last)
            if CMTimeCompare(delta, minFrameInterval) < 0 {
              continue
            }
          }
          lastAppendedPTS = pts

          if !writerInput.append(sampleBuffer) {
            finish()
            return
          }

          let now = CFAbsoluteTimeGetCurrent()
          if now - lastProgressTime >= 0.1 {
            lastProgressTime = now
            let progress = min(CMTimeGetSeconds(pts) / totalDuration, 1.0)
            self.onProgress(self.jobId, progress)
          }
        }
      }
    }
  }

  private func processAudioTrack(
    readerOutput: AVAssetReaderOutput,
    writerInput: AVAssetWriterInput
  ) async {
    var finished = false

    await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
      writerInput.requestMediaDataWhenReady(
        on: DispatchQueue(label: "com.bsky.videocompress.audio")
      ) {
        let finish = {
          if !finished {
            finished = true
            writerInput.markAsFinished()
            continuation.resume()
          }
        }
        while writerInput.isReadyForMoreMediaData {
          if finished { return }
          if self.isCancelled {
            finish()
            return
          }
          guard let sampleBuffer = readerOutput.copyNextSampleBuffer() else {
            finish()
            return
          }
          if !writerInput.append(sampleBuffer) {
            finish()
            return
          }
        }
      }
    }
  }

  private func makeRotatingComposition(
    videoTrack: AVAssetTrack,
    preferredTransform: CGAffineTransform,
    naturalSize: CGSize,
    outputSize: (width: Int, height: Int),
    duration: CMTime
  ) -> AVMutableVideoComposition {
    let composition = AVMutableVideoComposition()
    composition.renderSize = CGSize(width: outputSize.width, height: outputSize.height)
    composition.frameDuration = CMTime(value: 1, timescale: Int32(frameRateCap))

    let rotatedRect = CGRect(origin: .zero, size: naturalSize).applying(preferredTransform)
    let translate = CGAffineTransform(
      translationX: -rotatedRect.minX,
      y: -rotatedRect.minY
    )
    let displaySize = CGSize(
      width: abs(rotatedRect.width),
      height: abs(rotatedRect.height)
    )
    let scaleX = CGFloat(outputSize.width) / displaySize.width
    let scaleY = CGFloat(outputSize.height) / displaySize.height
    let scale = CGAffineTransform(scaleX: scaleX, y: scaleY)
    let combined = preferredTransform.concatenating(translate).concatenating(scale)

    let layerInstruction = AVMutableVideoCompositionLayerInstruction(assetTrack: videoTrack)
    layerInstruction.setTransform(combined, at: .zero)

    let instruction = AVMutableVideoCompositionInstruction()
    instruction.timeRange = CMTimeRange(start: .zero, duration: duration)
    instruction.layerInstructions = [layerInstruction]

    composition.instructions = [instruction]
    return composition
  }

  private func scaleEvenly(displaySize: CGSize, maxSize: Int) -> (width: Int, height: Int) {
    let cap = CGFloat(maxSize)
    let scale: CGFloat
    if displaySize.width <= cap && displaySize.height <= cap {
      scale = 1.0
    } else if displaySize.width > displaySize.height {
      scale = cap / displaySize.width
    } else {
      scale = cap / displaySize.height
    }
    return (
      roundToEven(Int(displaySize.width * scale)),
      roundToEven(Int(displaySize.height * scale))
    )
  }

  private func roundToEven(_ value: Int) -> Int {
    return value % 2 == 0 ? value : value - 1
  }

  private func err(_ message: String, code: Int) -> NSError {
    return NSError(
      domain: "ExpoBlueskyVideoCompress",
      code: code,
      userInfo: [NSLocalizedDescriptionKey: message]
    )
  }
}
