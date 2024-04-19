import AVKit

class PlayerController: AVPlayerViewController, AVPlayerViewControllerDelegate {
  private var _superview: ExpoBlueskyVideoPlayerView? = nil
  private var isVisible = false
  private var playerItem: AVPlayerItem?

  var source: String? = nil
  
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
      
      if let asset = self.playerItem?.asset as? AVURLAsset {
        PlayerItemManager.shared.saveToCache(source: asset.url.absoluteString)
      }
    }
  }
  
  // Because iOS will pause any active videos on background, we need to
  // begin playing again on foreground
  @objc func willEnterForeground(notification: Notification) {
    if self.isVisible, self._superview?.isPlaying == true {
      self.play()
    }
  }
  
  public override func observeValue(forKeyPath keyPath: String?, of object: Any?, change: [NSKeyValueChangeKey : Any]?, context: UnsafeMutableRawPointer?) {
    if keyPath == "status" {
      if self.playerItem?.status == .readyToPlay, let player = self.player {
        if _superview?.autoplay == true, _superview?.isPlaying == true {
          self._superview?.isLoaded = true
          player.play()
        }
      }
    }
  }
  
  func prepare(_ source: String, view: ExpoBlueskyVideoPlayerView) {
    if self._superview == nil {
      self.source = source
      self._superview = view
    }
    
    if let asset = PlayerItemManager.shared.getAsset(source: source) {
      let playerItem = AVPlayerItem(asset: asset)
      playerItem.addObserver(self, forKeyPath: "status", options: [.old, .new], context: nil)
      self.player?.replaceCurrentItem(with: playerItem)
      self.playerItem = playerItem
    }
    
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(playerItemDidReachEnd(notification:)),
      name: AVPlayerItem.didPlayToEndTimeNotification,
      object: nil
    )
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(willEnterForeground(notification:)),
      name: UIApplication.willEnterForegroundNotification,
      object: nil
    )
    
    self.isVisible = true
    
    if self._superview?.isPlaying == true, self.player?.status == .readyToPlay {
      self.play()
    }
  }
  
  func release() {
    // We always want to remove these observers for perf reasons. We don't need them unless the player is visible to the user.
    NotificationCenter.default.removeObserver(
      self,
      name: AVPlayerItem.didPlayToEndTimeNotification,
      object: nil
    )
    
    NotificationCenter.default.removeObserver(
      self,
      name: UIApplication.willEnterForegroundNotification,
      object: nil
    )
    
    self.pause()
    self.player?.replaceCurrentItem(with: nil)
    self.isVisible = false
    self._superview?.isLoaded = false
  }
  
  func play() {
    self.player?.play()
  }
  
  func pause() {
    self.player?.pause()
  }
}
