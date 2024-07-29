//
//  HLSDownload.swift
//  ExpoBlueskySwissArmy
//
//  Created by Hailey on 7/29/24.
//

import Foundation
import AVKit

class HLSDownload {
  private let avAsset: AVAsset
  private var exportSession: AVAssetExportSession?
  let sourceUrl: URL
  
  init (sourceUrl: URL) {
    self.sourceUrl = sourceUrl
    self.avAsset = AVAsset(url: sourceUrl)
  }
  
  func download(progress: @escaping(Float) -> Void) async -> URL? {
    guard let exportSession = AVAssetExportSession(asset: self.avAsset, presetName: AVAssetExportPresetHighestQuality) else {
      // @TODO return an error for the user here
      print("Export session error")
      return nil
    }
    
    let outDir = FileManager().urls(for: .cachesDirectory, in: .userDomainMask)[0]
    guard let outUrl = URL(string: "\(outDir.absoluteString)\(ProcessInfo.processInfo.globallyUniqueString).mp4") else {
      print("oops failed to make a url")
      return nil
    }
    
    print(outUrl.absoluteString)
    
    exportSession.outputFileType = AVFileType.mp4
    exportSession.outputURL =  outUrl
    
    let timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { (_: Timer) in
      // Do something here
    }
    
    self.exportSession = exportSession
    await exportSession.export()
    
    // Update with final progress
    progress(1)
    // Stop calling the callback
    timer.invalidate()
    
    return outUrl
  }
  
  func progress() -> Float {
    guard let exportSession = self.exportSession else {
      return 0
    }
    return exportSession.progress
  }
  
  func cancel() {
    // Cancel the download
  }
}
