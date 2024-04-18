import AVKit

class PlayerController: AVPlayerViewController, AVPlayerViewControllerDelegate {
  var source: String? = nil
  var _superview: ExpoBlueskyVideoPlayerView? = nil
  var needsCaching = true
  
  var isInUse = false
  var playerItem:  AVPlayerItem?  {
    get {
      return self.player?.currentItem
    }
    set {
      self.player?.replaceCurrentItem(with: newValue)
    }
  }
  var itemStatus: AVPlayerItem.Status? {
    get {
      return self.playerItem?.status
    }
  }
  
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
  
  override init(nibName nibNameOrNil: String?, bundle nibBundleOrNil: Bundle?) {
    super.init(nibName: nil, bundle: nil)
    
    let player = AVPlayer()
    player.actionAtItemEnd = .none
    player.volume = .zero
    self.player = player
    
    self.delegate = self
    self.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    self.view.backgroundColor = .clear
    self.showsPlaybackControls = false
    self.allowsPictureInPicturePlayback = false
    self.entersFullScreenWhenPlaybackBegins = true
    self.updatesNowPlayingInfoCenter = false
    if #available(iOS 16.0, *) {
      self.allowsVideoFrameAnalysis = false
    }
  }
  
  deinit {
    self.release()
  }

  func setFrame(rect: CGRect) {
    self.view.frame = rect
  }
  
  @objc func playerItemDidReachEnd(notification: Notification) {
    if let playerItem = notification.object as? AVPlayerItem {
      playerItem.seek(to: CMTime.zero, completionHandler: nil)
      
      if self.needsCaching, let asset = self.playerItem?.asset as? AVURLAsset {
        PlayerItemManager.shared.saveToCache(source: asset.url.absoluteString)
        self.needsCaching = false
      }
    }
  }
  
  public override func observeValue(forKeyPath keyPath: String?, of object: Any?, change: [NSKeyValueChangeKey : Any]?, context: UnsafeMutableRawPointer?) {
    if keyPath == "status", let playerItem = object as? AVPlayerItem {
      if playerItem.status == .readyToPlay, let player = self.player {
        if _superview?.autoplay == true, _superview?.isPlaying == true {
          player.play()
        }
      }
    }
  }
  
  func initForView(_ source: String, view: ExpoBlueskyVideoPlayerView) {
    if let playerItemAndInfo = PlayerItemManager.shared.getItem(source: source) {
      let playerItem = playerItemAndInfo.0
      self.needsCaching = !playerItemAndInfo.1
      
      playerItem.addObserver(self, forKeyPath: "status", options: [.old, .new], context: nil)
      NotificationCenter.default.addObserver(
        self,
        selector: #selector(playerItemDidReachEnd(notification:)),
        name: AVPlayerItem.didPlayToEndTimeNotification,
       object: playerItem
      )
      
      self.isInUse = true
      self.source = source
      self.playerItem = playerItem
      self._superview = view
    }
  }
  
  func release() {
    NotificationCenter.default.removeObserver(
      self,
      name: AVPlayerItem.didPlayToEndTimeNotification,
      object: self.playerItem
    )
    
    self.needsCaching = true
    self.isInUse = false
    self.pause()
    self.playerItem = nil
    self.removeFromParent()
  }
  
  func play() {
    self.player?.play()
  }
  
  func pause() {
    self.player?.pause()
  }
}
