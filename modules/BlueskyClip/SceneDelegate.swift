import UIKit

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene else {
      return
    }

    let window = UIWindow(windowScene: windowScene)
    let controller = ViewController(window: window)
    window.rootViewController = controller
    self.window = window

    // Load the WebView before delivering the cold-launch invocation URL.
    controller.loadViewIfNeeded()
    if let url = connectionOptions.userActivities.compactMap({ $0.webpageURL }).first
      ?? connectionOptions.urlContexts.first?.url {
      controller.handleURL(url: url)
    }

    window.makeKeyAndVisible()
  }

  func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    if let url = userActivity.webpageURL {
      (window?.rootViewController as? ViewController)?.handleURL(url: url)
    }
  }

  func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    if let url = URLContexts.first?.url {
      (window?.rootViewController as? ViewController)?.handleURL(url: url)
    }
  }
}
