import UIKit

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?
  private var controller: ViewController?

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
    self.window = window
    self.controller = controller
    window.rootViewController = controller
    window.makeKeyAndVisible()

    if let url = connectionOptions.userActivities.compactMap({ $0.webpageURL }).first
      ?? connectionOptions.urlContexts.first?.url {
      controller.handleURL(url: url)
    }
  }

  func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    if let url = userActivity.webpageURL {
      controller?.handleURL(url: url)
    }
  }

  func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    if let url = URLContexts.first?.url {
      controller?.handleURL(url: url)
    }
  }
}
