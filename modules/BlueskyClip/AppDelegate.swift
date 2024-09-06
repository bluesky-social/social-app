import UIKit

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?
  var controller: ViewController?

  func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    let window = UIWindow()
    self.window = UIWindow()

    let controller = ViewController(window: window)
    self.controller = controller

    window.rootViewController = self.controller
    window.makeKeyAndVisible()

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
