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

    // Test

    View(HLSDownloadView.self) {
      Events([
        "onStart",
        "onError",
        "onProgress",
        "onSuccess"
      ])

      Prop("downloaderUrl") { (view: HLSDownloadView, downloaderUrl: URL) in
        view.downloaderUrl = downloaderUrl
      }

      AsyncFunction("downloadAsync") { (view: HLSDownloadView, sourceUrl: URL) in
        view.startDownload(sourceUrl: sourceUrl)
      }

      AsyncFunction("cancelAsync") { (_: HLSDownloadView) in
      }
    }
  }
}
