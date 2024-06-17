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
    
    self.webView = webView
  }
  
  func handleURL(url: URL) {
    let urlString = "\(url.absoluteString)?clip=true"
    
    if let url = URL(string: urlString) {
      self.webView?.load(URLRequest(url: url))
    }
  }
}
