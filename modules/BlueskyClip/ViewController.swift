import UIKit
import WebKit

class ViewController: UIViewController {
  var webView: WKWebView?
  
  override func viewDidLoad() {
    super.viewDidLoad()

    let webView = WKWebView(frame: self.view.bounds)
    webView.translatesAutoresizingMaskIntoConstraints = false
    webView.contentMode = .scaleToFill

    self.view.addSubview(webView)

    if let url = URL(string: "http://localhost:19006/start/haileyok.com/3kuw7byr7gd2x?clip=true") {
      webView.load(URLRequest(url: url))
    }
  }
}
