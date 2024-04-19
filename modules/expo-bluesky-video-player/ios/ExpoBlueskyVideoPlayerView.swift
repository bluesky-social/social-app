import ExpoModulesCore

public class ExpoBlueskyVideoPlayerView: ExpoView, AVPlayerViewControllerDelegate {
  let onPlayerStateChange = EventDispatcher()
  
  private var controller: PlayerController
  
  var source: String? = nil
  var autoplay = true
  var isPlaying = true
  var isLoaded: Bool = false {
    didSet {
      self.firePlayerStateChange()
    }
  }
  
  public override var bounds: CGRect {
    didSet {
      controller.setFrame(rect: bounds)
    }
  }
  
  public required init(appContext: AppContext? = nil) {
    self.controller = PlayerController()
    super.init(appContext: appContext)
    self.clipsToBounds = true
    
    self.controller.setFrame(rect: bounds)
    self.addSubview(self.controller.view)
  }
  
  public override func willMove(toWindow newWindow: UIWindow?) {
    if newWindow != nil {
      guard let source = self.source else {
        return
      }
      self.controller.prepare(source, view: self)
    } else {
      self.controller.release()
    }
  }
  
  func firePlayerStateChange() {
    onPlayerStateChange([
      "isPlaying": isPlaying,
      "isLoaded": isLoaded,
    ])
  }
  
  func play() {
    self.isPlaying = true
    self.controller.play()
    self.firePlayerStateChange()
  }
  
  func pause() {
    self.isPlaying = false
    self.controller.pause()
    self.firePlayerStateChange()
  }
  
  func toggle() {
    if self.isPlaying {
      self.pause()
    } else {
      self.play()
    }
  }
}
