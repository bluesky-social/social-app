import AVFoundation

class VideoCompressor {
  private let url: URL
  private let targetBitrate: Int
  private let maxSize: Int
  private let jobId: Int
  private let onProgress: (Int, Double) -> Void
  private var isCancelled = false

  init(
    url: URL,
    targetBitrate: Int,
    maxSize: Int,
    jobId: Int,
    onProgress: @escaping (Int, Double) -> Void
  ) {
    self.url = url
    self.targetBitrate = targetBitrate
    self.maxSize = maxSize
    self.jobId = jobId
    self.onProgress = onProgress
  }

  func cancel() {
    isCancelled = true
  }

  func compress() async throws -> [String: Any] {
    let asset = AVURLAsset(url: url)
    let duration = try await asset.load(.duration)
    let totalSeconds = CMTimeGetSeconds(duration)

    guard totalSeconds > 0 else {
      throw NSError(
        domain: "ExpoVideoCompress",
        code: 2,
        userInfo: [NSLocalizedDescriptionKey: "Invalid video duration"]
      )
    }

    // Load video track
    let videoTracks = try await asset.loadTracks(withMediaType: .video)
    guard let videoTrack = videoTracks.first else {
      throw NSError(
        domain: "ExpoVideoCompress",
        code: 1,
        userInfo: [NSLocalizedDescriptionKey: "No video track found"]
      )
    }

    let naturalSize = try await videoTrack.load(.naturalSize)
    let preferredTransform = try await videoTrack.load(.preferredTransform)

    // Calculate output dimensions
    let outputSize = calculateOutputSize(
      naturalSize: naturalSize,
      transform: preferredTransform,
      maxSize: maxSize
    )

    // Load audio tracks
    let audioTracks = try await asset.loadTracks(withMediaType: .audio)
    let hasAudio = !audioTracks.isEmpty

    // Audio analysis for passthrough decision
    var shouldPassthroughAudio = false
    if hasAudio, let audioTrack = audioTracks.first {
      shouldPassthroughAudio = try await canPassthroughAudio(audioTrack)
    }

    // Create output file
    let outputURL = FileManager.default.temporaryDirectory
      .appendingPathComponent(UUID().uuidString)
      .appendingPathExtension("mp4")

    // Set up reader
    let reader = try AVAssetReader(asset: asset)
    let writer = try AVAssetWriter(outputURL: outputURL, fileType: .mp4)

    // Video reader output - request raw frames
    let videoReaderSettings: [String: Any] = [
      kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange
    ]
    let videoReaderOutput = AVAssetReaderTrackOutput(
      track: videoTrack,
      outputSettings: videoReaderSettings
    )
    videoReaderOutput.alwaysCopiesSampleData = false

    guard reader.canAdd(videoReaderOutput) else {
      throw NSError(
        domain: "ExpoVideoCompress",
        code: 3,
        userInfo: [NSLocalizedDescriptionKey: "Cannot read video track"]
      )
    }
    reader.add(videoReaderOutput)

    // Video writer input
    let videoWriterSettings: [String: Any] = [
      AVVideoCodecKey: AVVideoCodecType.h264,
      AVVideoWidthKey: outputSize.width,
      AVVideoHeightKey: outputSize.height,
      AVVideoCompressionPropertiesKey: [
        AVVideoAverageBitRateKey: targetBitrate,
        AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
        AVVideoMaxKeyFrameIntervalKey: 90, // ~3s at 30fps
        AVVideoExpectedSourceFrameRateKey: 30
      ] as [String: Any]
    ]
    let videoWriterInput = AVAssetWriterInput(
      mediaType: .video,
      outputSettings: videoWriterSettings
    )
    videoWriterInput.expectsMediaDataInRealTime = false

    // Apply transform for rotation
    videoWriterInput.transform = preferredTransform

    guard writer.canAdd(videoWriterInput) else {
      throw NSError(
        domain: "ExpoVideoCompress",
        code: 4,
        userInfo: [NSLocalizedDescriptionKey: "Cannot write video track"]
      )
    }
    writer.add(videoWriterInput)

    // Audio setup
    var audioReaderOutput: AVAssetReaderOutput?
    var audioWriterInput: AVAssetWriterInput?

    if hasAudio, let audioTrack = audioTracks.first {
      if shouldPassthroughAudio {
        // Passthrough - copy audio as-is
        let audioOutput = AVAssetReaderTrackOutput(
          track: audioTrack,
          outputSettings: nil
        )
        audioOutput.alwaysCopiesSampleData = false
        if reader.canAdd(audioOutput) {
          reader.add(audioOutput)
          audioReaderOutput = audioOutput

          let audioInput = AVAssetWriterInput(
            mediaType: .audio,
            outputSettings: nil
          )
          audioInput.expectsMediaDataInRealTime = false
          if writer.canAdd(audioInput) {
            writer.add(audioInput)
            audioWriterInput = audioInput
          }
        }
      } else {
        // Re-encode audio to AAC 128kbps
        let audioDecoderSettings: [String: Any] = [
          AVFormatIDKey: kAudioFormatLinearPCM,
          AVSampleRateKey: 44100,
          AVNumberOfChannelsKey: 2,
          AVLinearPCMBitDepthKey: 16,
          AVLinearPCMIsFloatKey: false,
          AVLinearPCMIsBigEndianKey: false,
          AVLinearPCMIsNonInterleaved: false
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
            AVEncoderBitRateKey: 128_000
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
    }

    // Start reading/writing
    reader.startReading()
    writer.startWriting()
    writer.startSession(atSourceTime: .zero)

    // Process video and audio concurrently
    try await withThrowingTaskGroup(of: Void.self) { group in
      // Video processing
      group.addTask {
        try await self.processTrack(
          readerOutput: videoReaderOutput,
          writerInput: videoWriterInput,
          totalDuration: totalSeconds
        )
      }

      // Audio processing
      if let audioOutput = audioReaderOutput, let audioInput = audioWriterInput {
        group.addTask {
          try await self.processTrack(
            readerOutput: audioOutput,
            writerInput: audioInput,
            totalDuration: nil
          )
        }
      }

      try await group.waitForAll()
    }

    // Check for cancellation
    if isCancelled {
      writer.cancelWriting()
      try? FileManager.default.removeItem(at: outputURL)
      throw NSError(
        domain: "ExpoVideoCompress",
        code: 5,
        userInfo: [NSLocalizedDescriptionKey: "Compression cancelled"]
      )
    }

    // Check reader status
    if reader.status == .failed {
      let error = reader.error ?? NSError(
        domain: "ExpoVideoCompress",
        code: 6,
        userInfo: [NSLocalizedDescriptionKey: "Reader failed"]
      )
      writer.cancelWriting()
      try? FileManager.default.removeItem(at: outputURL)
      throw error
    }

    // Finish writing
    await writer.finishWriting()

    if writer.status == .failed {
      let error = writer.error ?? NSError(
        domain: "ExpoVideoCompress",
        code: 7,
        userInfo: [NSLocalizedDescriptionKey: "Writer failed"]
      )
      try? FileManager.default.removeItem(at: outputURL)
      throw error
    }

    // Get output file attributes
    let attributes = try FileManager.default.attributesOfItem(atPath: outputURL.path)
    let fileSize = attributes[.size] as? Int ?? 0

    return [
      "uri": outputURL.absoluteString,
      "size": fileSize,
      "mimeType": "video/mp4",
      "width": outputSize.width,
      "height": outputSize.height,
      "duration": totalSeconds
    ]
  }

  private func processTrack(
    readerOutput: AVAssetReaderOutput,
    writerInput: AVAssetWriterInput,
    totalDuration: Double?
  ) async throws {
    var lastProgressTime: CFAbsoluteTime = 0

    await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
      writerInput.requestMediaDataWhenReady(on: DispatchQueue(label: "com.bluesky.videocompress")) {
        while writerInput.isReadyForMoreMediaData {
          if self.isCancelled {
            writerInput.markAsFinished()
            continuation.resume()
            return
          }

          guard let sampleBuffer = readerOutput.copyNextSampleBuffer() else {
            writerInput.markAsFinished()
            continuation.resume()
            return
          }

          // Send progress events (throttled to ~10/sec) for video track only
          if let totalDuration = totalDuration {
            let now = CFAbsoluteTimeGetCurrent()
            if now - lastProgressTime >= 0.1 {
              lastProgressTime = now
              let pts = CMSampleBufferGetPresentationTimeStamp(sampleBuffer)
              let progress = min(CMTimeGetSeconds(pts) / totalDuration, 1.0)
              self.onProgress(self.jobId, progress)
            }
          }

          writerInput.append(sampleBuffer)
        }
      }
    }
  }

  private func calculateOutputSize(
    naturalSize: CGSize,
    transform: CGAffineTransform,
    maxSize: Int
  ) -> (width: Int, height: Int) {
    // Use display dimensions (rotated) to determine the scale factor,
    // but return storage dimensions (unrotated) for the encoder.
    // The writer's transform handles rotation separately.
    let isRotated = abs(transform.b) == 1.0 && abs(transform.c) == 1.0
    let displayWidth = isRotated ? naturalSize.height : naturalSize.width
    let displayHeight = isRotated ? naturalSize.width : naturalSize.height

    let maxDimension = CGFloat(maxSize)

    // If display dimensions within bounds, keep original storage size (rounded to even)
    if displayWidth <= maxDimension && displayHeight <= maxDimension {
      return (
        width: roundToEven(Int(naturalSize.width)),
        height: roundToEven(Int(naturalSize.height))
      )
    }

    // Scale based on display dimensions
    let scale: CGFloat
    if displayWidth > displayHeight {
      scale = maxDimension / displayWidth
    } else {
      scale = maxDimension / displayHeight
    }

    // Return storage dimensions (unrotated)
    return (
      width: roundToEven(Int(naturalSize.width * scale)),
      height: roundToEven(Int(naturalSize.height * scale))
    )
  }

  private func roundToEven(_ value: Int) -> Int {
    return value % 2 == 0 ? value : value - 1
  }

  private func canPassthroughAudio(_ audioTrack: AVAssetTrack) async throws -> Bool {
    let formatDescriptions = try await audioTrack.load(.formatDescriptions)
    guard let formatDesc = formatDescriptions.first else {
      return false
    }

    let mediaSubType = CMFormatDescriptionGetMediaSubType(formatDesc)

    // Always passthrough AAC regardless of bitrate — the server re-encodes
    // everything anyway, and the bitrate difference is negligible.
    return mediaSubType == kAudioFormatMPEG4AAC
  }
}
