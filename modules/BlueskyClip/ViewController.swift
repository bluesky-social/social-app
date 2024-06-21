import UIKit
import WebKit
import StoreKit

class ViewController: UIViewController, WKScriptMessageHandler, WKNavigationDelegate {
  let defaults = UserDefaults(suiteName: "group.app.bsky")

  var window: UIWindow
  var webView: WKWebView?

  var prevUrl: URL?
  var starterPackUrl: URL?

  init(window: UIWindow) {
    self.window = window
    super.init(nibName: nil, bundle: nil)
  }

  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  override func viewDidLoad() {
    super.viewDidLoad()

    let contentController = WKUserContentController()
    contentController.add(self, name: "onMessage")
    let configuration = WKWebViewConfiguration()
    configuration.userContentController = contentController

    let webView = WKWebView(frame: self.view.bounds, configuration: configuration)
    webView.translatesAutoresizingMaskIntoConstraints = false
    webView.contentMode = .scaleToFill
    webView.navigationDelegate = self
    self.view.addSubview(webView)
    self.webView = webView
  }

  func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
    guard let response = message.body as? String,
          let data = response.data(using: .utf8),
          let payload = try? JSONDecoder().decode(WebViewActionPayload.self, from: data) else {
      return
    }

    switch payload.action {
    case .present:
      guard let url = self.starterPackUrl else {
        return
      }

      self.presentAppStoreOverlay()
      defaults?.setValue(url.absoluteString, forKey: "starterPackUri")

    case .store:
      guard let keyToStoreAs = payload.keyToStoreAs, let jsonToStore = payload.jsonToStore else {
        return
      }

      self.defaults?.setValue(jsonToStore, forKey: keyToStoreAs)
    }
  }

  func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
    // Detect when we land on the right URL. This is incase of a short link opening the app clip
    guard let url = navigationAction.request.url,
          getHost(url) != getHost(prevUrl),
          url.pathComponents != prevUrl?.pathComponents else {
      decisionHandler(.cancel)
      return
    }

    prevUrl = url

    // pathComponents starts with "/" as the first component, then each path name. so...
    // ["/", "start", "name", "rkey"]
    if url.pathComponents.count == 4,
       url.pathComponents[1] == "start" {

      self.starterPackUrl = url

      if let newURL = URL(string: "\(url.absoluteString)?clip=true"),
         let webView = self.webView {
        var newReq = URLRequest(url: newURL)
        newReq.httpMethod = navigationAction.request.httpMethod
        newReq.allHTTPHeaderFields = navigationAction.request.allHTTPHeaderFields
        newReq.httpBody = navigationAction.request.httpBody
        webView.load(newReq)

        decisionHandler(.cancel)
        return
      }
    }

    decisionHandler(.allow)
  }

  func handleURL(url: URL) {
    self.webView?.load(URLRequest(url: url))
  }

  func presentAppStoreOverlay() {
    guard let windowScene = self.window.windowScene else {
      return
    }

    let configuration = SKOverlay.AppClipConfiguration(position: .bottomRaised)
    let overlay = SKOverlay(configuration: configuration)

    overlay.present(in: windowScene)
  }

  func getHost(_ url: URL?) -> String? {
    if #available(iOS 16.0, *) {
      return url?.host()
    } else {
      return url?.host
    }
  }
}

struct WebViewActionPayload: Decodable {
  enum Action: String, Decodable {
    case present, store
  }

  let action: Action
  let keyToStoreAs: String?
  let jsonToStore: String?
}
