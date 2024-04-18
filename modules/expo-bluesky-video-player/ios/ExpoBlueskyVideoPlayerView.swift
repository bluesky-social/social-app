import ExpoModulesCore

public class ExpoBlueskyVideoPlayerView: ExpoView, AVPlayerViewControllerDelegate {
  public var source: String? = nil
  public var isPlaying: Bool = true
  
  private var controller: PlayerController? = nil
  
  public override var bounds: CGRect {
    didSet {
      if let controller = controller {
        controller.setFrame(rect: bounds)
      }
    }
  }
  
  public required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    self.clipsToBounds = true
  }
  
  public override func willMove(toWindow newWindow: UIWindow?) {
    if newWindow != nil {
      guard let source = self.source else {
        return
      }
      
      if let controller = PlayerControllerManager.shared.getPlayer() {
        controller.setFrame(rect: bounds)
        controller.initForView(source, view: self)
        self.addSubview(controller.view)
        self.controller = controller
      }
    } else {
      self.controller?.release()
    }
  }
  
  func play() {
    self.isPlaying = true
    self.controller?.play()
  }
  
  func pause() {
    self.isPlaying = false
    self.controller?.pause()
  }
}
