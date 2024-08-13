import ExpoModulesCore
import WebKit

class HLSDownloadView: ExpoView, WKScriptMessageHandler, WKNavigationDelegate, WKDownloadDelegate {
  var webView: WKWebView!
  var downloaderUrl: URL?

  private var onStart = EventDispatcher()
  private var onError = EventDispatcher()
  private var onProgress = EventDispatcher()
  private var onSuccess = EventDispatcher()

  private var outputUrl: URL?

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

  // MARK: - view functions

  func startDownload(sourceUrl: URL) {
    guard let downloaderUrl = self.downloaderUrl,
          let url = URL(string: "\(downloaderUrl.absoluteString)?videoUrl=\(sourceUrl.absoluteString)") else {
      self.onError([
        "message": "Downloader URL is not set."
      ])
      return
    }

    self.onStart()
    self.webView.load(URLRequest(url: url))
  }

  // webview message handling

  func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
    guard let response = message.body as? String,
          let data = response.data(using: .utf8),
          let payload = try? JSONDecoder().decode(WebViewActionPayload.self, from: data) else {
      self.onError([
        "message": "Failed to decode JSON post message."
      ])
      return
    }

    switch payload.action {
    case .progress:
      guard let progress = payload.messageFloat else {
        self.onError([
          "message": "Failed to decode JSON post message."
        ])
        return
      }
      self.onProgress([
        "progress": progress
      ])
      case .error:
      guard let messageStr = payload.messageStr else {
        self.onError([
          "message": "Failed to decode JSON post message."
        ])
        return
      }
      self.onError([
        "message": messageStr
      ])
    }
  }

  func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction) async -> WKNavigationActionPolicy {
    guard #available(iOS 14.5, *) else {
      return .cancel
    }

    if navigationAction.shouldPerformDownload {
      return .download
    } else {
      return .allow
    }
  }

  // MARK: - wkdownloaddelegate

  @available(iOS 14.5, *)
  func webView(_ webView: WKWebView, navigationAction: WKNavigationAction, didBecome download: WKDownload) {
    download.delegate = self
  }

  @available(iOS 14.5, *)
  func webView(_ webView: WKWebView, navigationResponse: WKNavigationResponse, didBecome download: WKDownload) {
    download.delegate = self
  }

  @available(iOS 14.5, *)
  func download(_ download: WKDownload, decideDestinationUsing response: URLResponse, suggestedFilename: String, completionHandler: @escaping (URL?) -> Void) {
    let directory = NSTemporaryDirectory()
    let fileName = "\(NSUUID().uuidString).mp4"
    let url = NSURL.fileURL(withPathComponents: [directory, fileName])

    self.outputUrl = url
    completionHandler(url)
  }

  @available(iOS 14.5, *)
  func downloadDidFinish(_ download: WKDownload) {
    guard let url = self.outputUrl else {
      return
    }
    self.onSuccess([
      "uri": url.absoluteString
    ])
    self.outputUrl = nil
  }
}

struct WebViewActionPayload: Decodable {
  enum Action: String, Decodable {
    case progress, error
  }

  let action: Action
  let messageStr: String?
  let messageFloat: Float?
}
