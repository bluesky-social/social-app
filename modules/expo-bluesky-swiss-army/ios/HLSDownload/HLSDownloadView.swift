//
//  HLSDownload.swift
//  ExpoBlueskySwissArmy
//
//  Created by Hailey on 7/29/24.
//

import Foundation
import ExpoModulesCore
import AVKit
import WebKit

let ROOT_URL = "https://wasm-test.haileyok.com/"

class HLSDownloadView: ExpoView, WKScriptMessageHandler, WKNavigationDelegate {
  var webView: WKWebView!
  
  public required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    
    // controller for post message api
    let contentController = WKUserContentController()
    contentController.add(self, name: "onMessage")
    let configuration = WKWebViewConfiguration()
    configuration.userContentController = contentController
    
    // create webview
    let webView = WKWebView(frame: .zero, configuration: configuration)
    
    // Use these for debugging, to see the webview itself
    webView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    webView.layer.masksToBounds = false
    webView.backgroundColor = .clear
    webView.contentMode = .scaleToFill
    
    webView.navigationDelegate = self
    
    self.addSubview(webView)
    self.webView = webView
  }
  
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
  
  func download(sourceUrl: URL, progress: @escaping(Float) -> Void) {
    guard let url = self.createUrl(videoUrl: sourceUrl) else {
      return
    }
    print(url)
    self.webView.load(URLRequest(url: url))
  }
  
  func progress() {
  }
  
  func cancel() {
    // Cancel the download
  }
  
  func createUrl(videoUrl: URL) -> URL? {
    return URL(string: "\(ROOT_URL)?videoUrl=\(videoUrl.absoluteString)")
  }
  
  // webview message handling
  
  func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
    guard let response = message.body as? String,
          let data = response.data(using: .utf8),
          let payload = try? JSONDecoder().decode(WebViewActionPayload.self, from: data) else {
      return
    }
    
    switch payload.action {
    case .progress:
      guard let progress = payload.messageFloat else {
        return
      }
      break
    case .complete:
      break
    case .error:
      break
    }
  }
}

struct WebViewActionPayload: Decodable {
  enum Action: String, Decodable {
    case progress, complete, error
  }
  
  let action: Action
  let messageStr: String?
  let messageFloat: Float?
}
