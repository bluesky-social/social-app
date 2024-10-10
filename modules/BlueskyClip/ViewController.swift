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
    self.webView?.load(URLRequest(url: URL(string: "https://bsky.app/?splash=true&clip=true")!))
  }

  func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
    guard let response = message.body as? String,
          let data = response.data(using: .utf8),
          let payload = try? JSONDecoder().decode(WebViewActionPayload.self, from: data) else {
      return
    }
    
    switch payload.action {
    case .present:
      self.presentAppStoreOverlay()

      if let url = self.starterPackUrl {
        defaults?.setValue(url.absoluteString, forKey: "starterPackUri")
      }
    case .store:
      guard let keyToStoreAs = payload.keyToStoreAs, let jsonToStore = payload.jsonToStore else {
        return
      }

      self.defaults?.setValue(jsonToStore, forKey: keyToStoreAs)
    }
  }

  func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction) async -> WKNavigationActionPolicy {
    // Detect when we land on the right URL. This is incase of a short link opening the app clip
    guard let url = navigationAction.request.url else {
      return .allow
    }
    
    // Store the previous one to compare later, but only set starterPackUrl when we find the right one
    prevUrl = url
    // pathComponents starts with "/" as the first component, then each path name. so...
    // ["/", "start", "name", "rkey"]
    if isStarterPackUrl(url){
      self.starterPackUrl = url
    }
    
    return .allow
  }
  
  func isStarterPackUrl(_ url: URL) -> Bool {
    var host: String?
    if #available(iOS 16.0, *) {
      host = url.host()
    } else {
      host = url.host
    }
    
    switch host {
    case "bsky.app":
      if url.pathComponents.count == 4,
         (url.pathComponents[1] == "start" || url.pathComponents[1] == "starter-pack") {
        return true
      }
      return false
    case "go.bsky.app":
      if url.pathComponents.count == 2 {
        return true
      }
      return false
    default:
      return false
    }
  }

  func handleURL(url: URL) {
    if isStarterPackUrl(url) {
      let urlString = "\(url.absoluteString)?clip=true"
      if let url = URL(string: urlString) {
        self.webView?.load(URLRequest(url: url))
      }
    } else {
      self.webView?.load(URLRequest(url: URL(string: "https://bsky.app/?splash=true&clip=true")!))
    }
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

  func getQuery(_ url: URL?) -> String? {
    if #available(iOS 16.0, *) {
      return url?.query()
    } else {
      return url?.query
    }
  }

  func urlMatchesPrevious(_ url: URL?) -> Bool {
    if #available(iOS 16.0, *) {
      return url?.query() == prevUrl?.query() && url?.host() == prevUrl?.host() && url?.query() == prevUrl?.query()
    } else {
      return url?.query == prevUrl?.query && url?.host == prevUrl?.host && url?.query == prevUrl?.query
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
