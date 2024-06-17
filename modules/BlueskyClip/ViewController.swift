import UIKit
import WebKit
import StoreKit

class ViewController: UIViewController, WKScriptMessageHandler {
  let defaults = UserDefaults(suiteName: "group.app.bsky")

  var window: UIWindow
  var webView: WKWebView?
  var userContentController: WKUserContentController?

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

    self.view.addSubview(webView)
    self.webView = webView
  }

  func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
    guard let response = message.body as? String,
          let data = response.data(using: .utf8, allowLossyConversion: false),
          let payload = try? JSONDecoder().decode(WebViewActionPayload.self, from: data)
    else {
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

  func handleURL(url: URL) {
    self.starterPackUrl = url
    let urlString = "\(url.absoluteString)?clip=true"

    if let url = URL(string: urlString) {
      self.webView?.load(URLRequest(url: url))
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
}

struct WebViewActionPayload: Decodable {
  enum Action: String, Decodable {
    case present, store
  }

  let action: Action
  let keyToStoreAs: String?
  let jsonToStore: String?
}
