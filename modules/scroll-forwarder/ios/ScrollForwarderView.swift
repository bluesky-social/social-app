class ScrollForwarderView : UIView, UIGestureRecognizerDelegate {
  private let bridge: RCTBridge

  // This is the native tag for the RCTScrollView. We will find the view with findNativeScrollView() and get
  // the underlying UIScrollView
  @objc var scrollViewTag: String = "" {
    didSet {
      if !scrollViewTag.isEmpty {
        self.findNativeScrollView()
      }
    }
  }

  // These control the UIRefreshControl. There's some animation jank if we don't handle this separately from the React side,
  // so we start the refresh and end the refresh once complete here.
  @objc var onScrollViewRefresh: RCTDirectEventBlock?
  @objc var scrollViewRefreshing: Bool = false {
    didSet {
      if scrollViewRefreshing == false {
        self.scrollView?.refreshControl?.endRefreshing()
        self.scrollToOffset(0)
      }
    }
  }

  private var scrollView: UIScrollView?
  private var cancelGestureRecognizers: [UIGestureRecognizer]?
  private var animTimer: Timer?
  private var initialOffset: CGFloat = 0.0

  init(bridge: RCTBridge) {
    self.bridge = bridge
    super.init(frame: .zero)

    let pg = UIPanGestureRecognizer(target: self, action: #selector(callOnPan(_:)))
    pg.delegate = self
    self.addGestureRecognizer(pg)

    let tg = UITapGestureRecognizer(target: self, action: #selector(callOnPress(_:)))
    tg.isEnabled = false
    tg.delegate = self

    let lpg = UILongPressGestureRecognizer(target: self, action: #selector(callOnPress(_:)))
    lpg.minimumPressDuration = 0.01
    lpg.isEnabled = false
    lpg.delegate = self

    self.cancelGestureRecognizers = [lpg, tg]
  }

  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  // We don't want the pan recognizer to allow simultaneous gestures, otherwise when we scroll we might also start swiping
  // backwards, creating a weird effect.
  func gestureRecognizer(_ gestureRecognizer: UIGestureRecognizer, shouldRecognizeSimultaneouslyWith otherGestureRecognizer: UIGestureRecognizer) -> Bool {
    if gestureRecognizer is UIPanGestureRecognizer {
      return false
    }
    return true
  }

  // We only want to start recognizing if this is a vertical pan. If we recognize for both vertical and horizontal
  // pans, it interferes with the "swipe to go back" functionality on the profile.
  override func gestureRecognizerShouldBegin(_ gestureRecognizer: UIGestureRecognizer) -> Bool {
    if let gestureRecognizer = gestureRecognizer as? UIPanGestureRecognizer {
      let velocity = gestureRecognizer.velocity(in: self)
      return abs(velocity.y) > abs(velocity.x)
    }

    return true
  }

  // This will be used to cancel the scroll animation whenever we tap inside of the header. We don't need another
  // recognizer for this one.
  override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
    self.stopTimer()
  }

  // This will be used to cancel the animation whenever we press inside of the scroll view. We don't want to change
  // the scroll view gesture's delegate, so we add an additional recognizer to detect this.
  @IBAction func callOnPress(_ sender: UITapGestureRecognizer) -> Void {
    self.stopTimer()
  }

  @IBAction func callOnPan(_ sender: UIPanGestureRecognizer) -> Void {
    guard let sv = self.scrollView else {
      return
    }

    let translation = sender.translation(in: self).y
    let velocity = sender.translation(in: self).y

    if sender.state == .began {
      self.initialOffset = sv.contentOffset.y
    }

    if sender.state == .changed {
      sv.contentOffset.y = self.dampenOffset(-translation + self.initialOffset)
    }

    if sender.state == .ended {
      if sv.contentOffset.y < 0, sv.contentOffset.y > -130 {
        self.scrollToOffset(0)
      } else if sv.contentOffset.y <= -130 {
        let generator = UIImpactFeedbackGenerator(style: .light)
        generator.impactOccurred()

        onScrollViewRefresh?([:])
        sv.refreshControl?.beginRefreshing()
        self.scrollToOffset(-75)
      } else {
        var currentVelocity = sender.velocity(in: self).y

        // A check for a velocity under 250 prevents animations from occurring when they wouldn't in a normal
        // scroll view
        if abs(currentVelocity) < 250 {
          return
        }

        // Because this is the header, we just need to scroll to the top. We can't be far enough down the screen to where we need
        // to deal with animating this.
        if velocity > 0 {
          self.scrollToOffset(0)
          return
        }

        self.enableCancelRecognizers()

        // Clamping the velocity to a maximum of 5000 incase of any weirdness. I haven't seen any cases where we could
        // easily exceed this number, but just to make sure.
        currentVelocity = max(currentVelocity, -5000)

        // Ideally, we would use UIView.animate to do this. However, that messes with the FlatList's virtualization.
        // Running this on a timer instead simulates us actually dragging to update the content offset.
        var animTranslation = -translation
        self.animTimer = Timer.scheduledTimer(withTimeInterval: 1.0 / 120, repeats: true) { timer in
          currentVelocity *= 0.9875
          animTranslation = (-currentVelocity / 120) + animTranslation
          sv.contentOffset.y = self.dampenOffset(animTranslation + self.initialOffset)

          if animTranslation <= -100 {
            self.scrollToOffset(0)
            self.stopTimer()
          }

          if abs(currentVelocity) < 5 {
            self.stopTimer()
          }
        }
      }
    }
  }

  func findNativeScrollView() -> Void {
    // Before we switch to a different scrollview, we always want to remove the cancel gesture recognizer.
    // Otherwise we might end up with duplicates when we switch back to that scrollview.
    self.removeGestureRecognizersFromScrollView()

    guard let int = Int(self.scrollViewTag),
          let rctScrollView = self.bridge.uiManager.view(forReactTag: NSNumber(value: int)) as? RCTScrollView
    else {
      self.scrollView = nil
      return
    }

    self.scrollView = rctScrollView.scrollView
    self.addGestureRecognizersToScrollView()
  }

  func dampenOffset(_ offset: CGFloat) -> CGFloat {
    if offset < 0 {
      return offset - (offset * 0.55)
    }
    return offset
  }

  func addGestureRecognizersToScrollView() -> Void {
    self.cancelGestureRecognizers?.forEach { r in
      self.scrollView?.addGestureRecognizer(r)
    }  }

  func removeGestureRecognizersFromScrollView() -> Void {
    self.cancelGestureRecognizers?.forEach { r in
      self.scrollView?.removeGestureRecognizer(r)
    }
  }

  func enableCancelRecognizers() -> Void {
    self.cancelGestureRecognizers?.forEach { r in
      r.isEnabled = true
    }
  }

  func disableCancelRecognizers() -> Void {
    self.cancelGestureRecognizers?.forEach { r in
      r.isEnabled = false
    }
  }

  func scrollToOffset(_ offset: Int) -> Void {
    self.scrollView?.setContentOffset(CGPoint(x: 0, y: offset), animated: true)
  }

  func stopTimer() -> Void {
    self.disableCancelRecognizers()
    self.animTimer?.invalidate()
    self.animTimer = nil
  }
}
