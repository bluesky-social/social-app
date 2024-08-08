//
//  ExpoHLSDownloadModule.swift
//  ExpoBlueskySwissArmy
//
//  Created by Hailey on 7/29/24.
//

import ExpoModulesCore

public class ExpoHLSDownloadModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoHLSDownload")
    
    Function("isAvailable") {
      return UIDevice.current.systemVersion == "14.5"
    }
    
    View(HLSDownloadView.self) {
      Events(["onStart", "onError", "onProgress"])
      
      Prop("downloaderUrl") { (view: HLSDownloadView, downloaderUrl: URL) in
        view.downloaderUrl = downloaderUrl
      }
      
      AsyncFunction("downloadAsync") { (view: HLSDownloadView, sourceUrl: URL, progressCb: JavaScriptFunction<Void>) in
        view.download(sourceUrl: sourceUrl) { progress in
          try? progressCb.call(progress)
        }
      }
      
      AsyncFunction("cancelAsync") { (view: HLSDownloadView) in
//        view.cancel()
      }
    }
  }
}
