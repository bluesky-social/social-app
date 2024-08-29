import ExpoModulesCore

class VisibilityView: ExpoView {
  var enabled = false {
    didSet {
      if enabled {
        VisibilityViewManager.shared.removeView(self)
      }
    }
  }

  private let onChangeStatus = EventDispatcher()
  private var isCurrentlyActiveView = false

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
  }

  public override func willMove(toWindow newWindow: UIWindow?) {
    super.willMove(toWindow: newWindow)

    if !self.enabled {
      return
    }

    if newWindow == nil {
      VisibilityViewManager.shared.removeView(self)
    } else {
      VisibilityViewManager.shared.addView(self)
    }
  }

  func setIsCurrentlyActive(isActive: Bool) {
    if isCurrentlyActiveView == isActive {
      return
    }
    self.isCurrentlyActiveView = isActive
    self.onChangeStatus([
      "isActive": isActive
    ])
  }
}

// 🚨 DANGER 🚨
// These functions need to be called from the main thread. Xcode will warn you if you call one of them
// off the main thread, so pay attention!
extension UIView {
  func getPositionOnScreen() -> CGRect? {
    if let window = self.window {
      return self.convert(self.bounds, to: window)
    }
    return nil
  }

  func isViewableEnough() -> Bool {
    guard let window = self.window else {
      return false
    }

    let viewFrameOnScreen = self.convert(self.bounds, to: window)
    let screenBounds = window.bounds
    let intersection = viewFrameOnScreen.intersection(screenBounds)

    let viewHeight = viewFrameOnScreen.height
    let intersectionHeight = intersection.height

    return intersectionHeight >= 0.5 * viewHeight
  }
}
