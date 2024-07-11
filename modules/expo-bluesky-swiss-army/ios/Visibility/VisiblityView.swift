import ExpoModulesCore

class VisibilityView: ExpoView {
  // Props
  var enabled = false {
    didSet {
      if enabled {
        VisibilityViewManager.shared.removeView(self)
      }
    }
  }
  
  // Events
  let onActiveChange = EventDispatcher()
  
  var isCurrentlyActiveView = false
  
  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
  }
  
  public override func willMove(toWindow newWindow: UIWindow?) {
    if !self.enabled {
      return
    }
    
    if newWindow == nil {
      VisibilityViewManager.shared.removeView(self)
    } else {
      VisibilityViewManager.shared.addView(self)
    }
  }
  
  private func getCurrentPosition() -> CGRect? {
    guard let window = self.window else {
      return nil
    }
    
    return self.convert(self.bounds, to: window)
  }
  
  func getVisiblePixels() -> CGFloat? {
    guard let bounds = self.getCurrentPosition() else {
      return nil
    }
    return bounds.maxY - bounds.minY
  }
  
  func getMinY() -> CGFloat? {
    guard let bounds = self.getCurrentPosition() else {
      return nil
    }
    return bounds.minY
  }
  
  func setIsCurrentlyActive(isActive: Bool) {
    if isCurrentlyActiveView == isActive {
      return
    }
    
    self.isCurrentlyActiveView = isActive
    self.onActiveChange([
      "isVisible": isActive
    ])
  }
}
