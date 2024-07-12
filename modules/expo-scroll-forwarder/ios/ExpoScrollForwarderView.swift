import ExpoModulesCore

// This view will be used as a native component. Make sure to inherit from `ExpoView`
// to apply the proper styling (e.g. border radius and shadows).
class ExpoScrollForwarderView: ExpoView, UIGestureRecognizerDelegate {
  var scrollViewTag: Int? {
    didSet {
      self.tryFindScrollView()
    }
  }

  private var rctScrollView: RCTScrollView?
  private var rctRefreshCtrl: RCTRefreshControl?
  private var cancelGestureRecognizers: [UIGestureRecognizer]?
  private var animTimer: Timer?
  private var initialOffset: CGFloat = 0.0
  private var didImpact: Bool = false

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)

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

  // We don't want to recognize the scroll pan gesture and the swipe back gesture together
  func gestureRecognizer(_ gestureRecognizer: UIGestureRecognizer, shouldRecognizeSimultaneouslyWith otherGestureRecognizer: UIGestureRecognizer) -> Bool {
    if gestureRecognizer is UIPanGestureRecognizer, otherGestureRecognizer is UIPanGestureRecognizer {
      return false
    }

    return true
  }

  // We only want the "scroll" gesture to happen whenever the pan is vertical, otherwise it will
  // interfere with the native swipe back gesture.
  override func gestureRecognizerShouldBegin(_ gestureRecognizer: UIGestureRecognizer) -> Bool {
    guard let gestureRecognizer = gestureRecognizer as? UIPanGestureRecognizer else {
      return true
    }

    let velocity = gestureRecognizer.velocity(in: self)
    return abs(velocity.y) > abs(velocity.x)
  }

  // This will be used to cancel the scroll animation whenever we tap inside of the header. We don't need another
  // recognizer for this one.
  override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
    self.stopTimer()
  }

  // This will be used to cancel the animation whenever we press inside of the scroll view. We don't want to change
  // the scroll view gesture's delegate, so we add an additional recognizer to detect this.
  @IBAction func callOnPress(_ sender: UITapGestureRecognizer) {
    self.stopTimer()
  }

  @IBAction func callOnPan(_ sender: UIPanGestureRecognizer) {
    guard let rctsv = self.rctScrollView, let sv = rctsv.scrollView else {
      return
    }

    let translation = sender.translation(in: self).y

    if sender.state == .began {
      if sv.contentOffset.y < 0 {
        sv.contentOffset.y = 0
      }

      self.initialOffset = sv.contentOffset.y
    }

    if sender.state == .changed {
      sv.contentOffset.y = self.dampenOffset(-translation + self.initialOffset)

      if sv.contentOffset.y <= -130, !didImpact {
        let generator = UIImpactFeedbackGenerator(style: .light)
        generator.impactOccurred()

        self.didImpact = true
      }
    }

    if sender.state == .ended {
      let velocity = sender.velocity(in: self).y
      self.didImpact = false

      if sv.contentOffset.y <= -130 {
        self.rctRefreshCtrl?.forwarderBeginRefreshing()
        return
      }

      // A check for a velocity under 250 prevents animations from occurring when they wouldn't in a normal
      // scroll view
      if abs(velocity) < 250, sv.contentOffset.y >= 0 {
        return
      }

      self.startDecayAnimation(translation, velocity)
    }
  }

  func startDecayAnimation(_ translation: CGFloat, _ velocity: CGFloat) {
    guard let sv = self.rctScrollView?.scrollView else {
      return
    }

    var velocity = velocity

    self.enableCancelGestureRecognizers()

    if velocity > 0 {
      velocity = min(velocity, 5000)
    } else {
      velocity = max(velocity, -5000)
    }

    var animTranslation = -translation
    self.animTimer = Timer.scheduledTimer(withTimeInterval: 1.0 / 120, repeats: true) { _ in
      velocity *= 0.9875
      animTranslation = (-velocity / 120) + animTranslation

      let nextOffset = self.dampenOffset(animTranslation + self.initialOffset)

      if nextOffset <= 0 {
        if self.initialOffset <= 1 {
          self.scrollToOffset(0)
        } else {
          sv.contentOffset.y = 0
        }

        self.stopTimer()
        return
      } else {
        sv.contentOffset.y = nextOffset
      }

      if abs(velocity) < 5 {
        self.stopTimer()
      }
    }
  }

  func dampenOffset(_ offset: CGFloat) -> CGFloat {
    if offset < 0 {
      return offset - (offset * 0.55)
    }

    return offset
  }

  func tryFindScrollView() {
    guard let scrollViewTag = scrollViewTag else {
      return
    }

    // Before we switch to a different scrollview, we always want to remove the cancel gesture recognizer.
    // Otherwise we might end up with duplicates when we switch back to that scrollview.
    self.removeCancelGestureRecognizers()

    self.rctScrollView = self.appContext?
      .findView(withTag: scrollViewTag, ofType: RCTScrollView.self)
    self.rctRefreshCtrl = self.rctScrollView?.scrollView.refreshControl as? RCTRefreshControl

    self.addCancelGestureRecognizers()
  }

  func addCancelGestureRecognizers() {
    self.cancelGestureRecognizers?.forEach { r in
      self.rctScrollView?.scrollView?.addGestureRecognizer(r)
    }
  }

  func removeCancelGestureRecognizers() {
    self.cancelGestureRecognizers?.forEach { r in
      self.rctScrollView?.scrollView?.removeGestureRecognizer(r)
    }
  }

  func enableCancelGestureRecognizers() {
    self.cancelGestureRecognizers?.forEach { r in
      r.isEnabled = true
    }
  }

  func disableCancelGestureRecognizers() {
    self.cancelGestureRecognizers?.forEach { r in
      r.isEnabled = false
    }
  }

  func scrollToOffset(_ offset: Int, animated: Bool = true) {
    self.rctScrollView?.scroll(toOffset: CGPoint(x: 0, y: offset), animated: animated)
  }

  func stopTimer() {
    self.disableCancelGestureRecognizers()
    self.animTimer?.invalidate()
    self.animTimer = nil
  }
}
