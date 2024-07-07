import ExpoModulesCore

class VisiblityView: ExpoView {
  private let onVisibilityChange = EventDispatcher()
  
  init(appContext: AppContext) {
    super(appContex: appContext)
  }
  
  public override func willMove(toWindow newWindow: UIWindow?) {
    let isVisible = newWindow != nil
    onVisiblityChange([
      "isVisible": isVisible
    ])
  }
}
