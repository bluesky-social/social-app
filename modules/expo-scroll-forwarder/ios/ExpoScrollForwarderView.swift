import ExpoModulesCore

// This view will be used as a native component. Make sure to inherit from `ExpoView`
// to apply the proper styling (e.g. border radius and shadows).
class ExpoScrollForwarderView: ExpoView, UIGestureRecognizerDelegate {
  var scrollViewTag: Int? {
    didSet {
      self.tryFindScrollView()
    }
  }
  
  private var scrollView: UIScrollView?
  private var cancelGestureRecognizers: [UIGestureRecognizer]?
  private var animTimer: Timer?
  private var initialOffset: CGFloat = 0.0
  
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

//        onScrollViewRefresh?([:])
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

        self.enableCancelGestureRecognizers()

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
    
    self.scrollView = self.appContext?.findView(withTag: scrollViewTag, ofType: UIScrollView.self)
    self.addCancelGestureRecognizers()
  }
  
  func removeCancelGestureRecognizers() {    
    self.cancelGestureRecognizers?.forEach { r in
      self.scrollView?.removeGestureRecognizer(r)
    }
  }
  
  func addCancelGestureRecognizers() {
    self.cancelGestureRecognizers?.forEach { r in
      self.scrollView?.addGestureRecognizer(r)
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
  
  func scrollToOffset(_ offset: Int) -> Void {
    self.scrollView?.setContentOffset(CGPoint(x: 0, y: offset), animated: true)
  }

  func stopTimer() -> Void {
    self.disableCancelGestureRecognizers()
    self.animTimer?.invalidate()
    self.animTimer = nil
  }
}
