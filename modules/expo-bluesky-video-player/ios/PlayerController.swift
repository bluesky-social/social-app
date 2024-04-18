import AVKit

class PlayerController: AVPlayerViewController, AVPlayerViewControllerDelegate {
  private var playerLooper: AVPlayerLooper? = nil
  var source: String? = nil
  var _superview: ExpoBlueskyVideoPlayerView? = nil
  
  var isInUse = false
  var playerItem:  AVPlayerItem?  {
    get {
      return self.player?.currentItem
    }
    set {
      if newValue == nil {
        if let player = self.player as? AVQueuePlayer {
          player.removeAllItems()
        }
      } else {
        self.player?.replaceCurrentItem(with: newValue)
      }
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
    self.player = AVQueuePlayer()
    
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
    
    self.player?.actionAtItemEnd = .pause
    self.player?.volume = .zero
  }

  func setFrame(rect: CGRect) {
    self.view.frame = rect
  }
  
  public override func observeValue(forKeyPath keyPath: String?, of object: Any?, change: [NSKeyValueChangeKey : Any]?, context: UnsafeMutableRawPointer?) {
    if keyPath == "status", let playerItem = object as? AVPlayerItem {
      if playerItem.status == .readyToPlay, let player = self.player as? AVQueuePlayer {
        // GIFs frequently have some black frames at the end of the video. To account for that, we offset the duration by 100ms,
        // which should be enough frames to prevent a flicker.
        player.play()
        self.setLooper()
      }
    }
  }
  
  private func setLooper() {
    guard let player = self.player as? AVQueuePlayer, let playerItem = self.playerItem else {
      return
    }
    
    let duration = playerItem.duration
    self.playerLooper = AVPlayerLooper(
      player: player,
      templateItem: playerItem,
      timeRange: CMTimeRange(
        start: CMTime(value: 0, timescale: duration.timescale),
        duration: CMTime(value: duration.value - 100, timescale: 1000)
      )
    )
  }
  
  func initForView(_ source: String, view: ExpoBlueskyVideoPlayerView) {
    if let playerItem = PlayerItemManager.shared.getOrAddItem(source: source) {
      playerItem.addObserver(self, forKeyPath: "status", options: [.old, .new], context: nil)
      self.isInUse = true
      self.source = source
      self.playerItem = playerItem
      self._superview = view
      
      if view.isPlaying, self.itemStatus == .readyToPlay {
        self.play()
        self.setLooper()
      }
    }
  }
  
  func release() {
    self.isInUse = false
    self.pause()
    self.source = nil
    self.playerLooper = nil
    self.playerItem = nil
  }
  
  func play() {
    self.player?.play()
  }
  
  func pause() {
    self.player?.pause()
  }
}
