//
//  ExpoHLSDownloadModule.swift
//  DoubleConversion
//
//  Created by Hailey on 7/29/24.
//

import ExpoModulesCore

public class ExpoHLSDownloadModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoHLSDownload")
    
    View(HLSDownloadView.self) {
      AsyncFunction("downloadAsync") { (view: HLSDownloadView, sourceUrl: URL, progressCb: JavaScriptFunction<Void>) in
        view.download(sourceUrl: sourceUrl) { progress in
          try? progressCb.call(progress)
        }
      }
      
      AsyncFunction("cancelAsync") { (view: HLSDownloadView) in
        view.cancel()
      }
    }
  }
}
