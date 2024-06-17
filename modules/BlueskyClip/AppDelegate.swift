import UIKit

// https://dc19-24-237-65-73.ngrok-free.app/start/haileyok.com/3kuw7byr7gd2x

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?
  var controller: ViewController?

  func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    self.window = UIWindow()

    self.controller = ViewController(window: self.window!)

    self.window?.rootViewController = self.controller
    self.window?.makeKeyAndVisible()

    return true
  }

  func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
    self.controller?.handleURL(url: url)
    return true
  }

  func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
      if let incomingURL = userActivity.webpageURL {
        self.controller?.handleURL(url: incomingURL)
      }
      return true
  }
}
