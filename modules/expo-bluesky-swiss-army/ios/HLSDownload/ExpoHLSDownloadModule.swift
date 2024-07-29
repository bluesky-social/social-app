//
//  ExpoHLSDownloadModule.swift
//  DoubleConversion
//
//  Created by Hailey on 7/29/24.
//

import ExpoModulesCore

class ExpoHLSDownloadModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoHLSDownloadModule")
    
    AsyncFunction("downloadAsync") { (sourceUrl: URL, progressCb: JavaScriptFunction<Void>, promise: Promise) in
      let hlsDownload = HLSDownload(sourceUrl: sourceUrl)
      let downloadTask = Task {
        let outUrl = await hlsDownload.download { (progress: Float) in
          try? progressCb.call(progress)
        }
        promise.resolve(outUrl)
      }
    }
    
    AsyncFunction("cancelDownloadAsync") { (sourceUrl: URL) in
      DownloadManager.shared.cancel(url: sourceUrl)
    }
  }
}
