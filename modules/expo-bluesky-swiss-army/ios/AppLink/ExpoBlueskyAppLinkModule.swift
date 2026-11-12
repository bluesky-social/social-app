import ExpoModulesCore
import UIKit

public class ExpoBlueskyAppLinkModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoBlueskyAppLink")

    AsyncFunction("tryOpen") { (urlString: String, promise: Promise) in
      guard let url = URL(string: urlString),
            let scheme = url.scheme?.lowercased(),
            ["http", "https"].contains(scheme),
            url.host != nil else {
        promise.resolve(false)
        return
      }

      UIApplication.shared.open(url, options: [.universalLinksOnly: true]) { opened in
        promise.resolve(opened)
      }
    }.runOnQueue(.main)
  }
}
