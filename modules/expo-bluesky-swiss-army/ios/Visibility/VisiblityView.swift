import ExpoModulesCore

class VisibilityView: ExpoView {
  private let onVisibilityChange = EventDispatcher()
  
  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
  }
  
  public override func willMove(toWindow newWindow: UIWindow?) {
    onVisibilityChange([
      "isVisible": !(newWindow == nil)
    ])
  }
  
  func getPosition() -> CGPoint? {
    guard let window = self.window else {
      return nil
    }
    
    let frameInWindow = self.convert(self.bounds, to: window)
    return frameInWindow.origin
  }
}
