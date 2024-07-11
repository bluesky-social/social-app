import Foundation

class VisibilityViewManager {
  static let shared = VisibilityViewManager()

  let views = NSHashTable<VisibilityView>(options: .weakMemory)

  private var timer: Timer?

  private var currentlyActiveView: VisibilityView?
  private var screenHeight: CGFloat = UIScreen.main.bounds.height

  func addView(_ view: VisibilityView) {
    self.views.add(view)

    if timer == nil {
      self.startTimer()
    }
  }

  func removeView(_ view: VisibilityView) {
    self.views.remove(view)

    if self.views.count == 0 {
      self.invalidateTimer()
    }
  }

  func startTimer() {
    self.timer = Timer.scheduledTimer(
      withTimeInterval: 1.0,
      repeats: true,
      block: self.onInterval
    )
  }

  func invalidateTimer() {
    if let timer = self.timer {
      timer.invalidate()
      self.timer = nil
    }
  }

  func onInterval(timer: Timer) {
    var activeView: VisibilityView?

    print("interval")

    if self.views.count == 0 {
      print("none!")
      // Do nothing
    } else if self.views.count == 1 {
      print("only one")
      let view = self.views.allObjects[0]
      if let visiblePixels = view.getVisiblePixels(),
         visiblePixels >= view.bounds.height / 2 {
        activeView = view
      }
    } else {
      print("multiple views")
      let views = self.views.allObjects
      var mostVisibleView: VisibilityView?

      views.forEach { view in
        // Get the visibile pixels and only consider it as a candidate if the view is completely visible
        if let visiblePixels = view.getVisiblePixels(),
           visiblePixels >= view.bounds.height {
          // If there's a currently visible view let's compare
          guard let currentlyMostVisibleView = mostVisibleView,
                let currentlyMostMinY = currentlyMostVisibleView.getMinY() else {
            mostVisibleView = view
            return
          }

          if let minY = view.getMinY(),
             minY < currentlyMostMinY {
            mostVisibleView = view
          }
        }
      }

      activeView = mostVisibleView
    }

    print(activeView?.reactTag)

    if let view = activeView, view != self.currentlyActiveView {
      self.setActiveView(view)
    }
  }

  func setActiveView(_ view: VisibilityView) {
    self.currentlyActiveView?.setIsCurrentlyActive(isActive: false)
    view.setIsCurrentlyActive(isActive: true)
    self.currentlyActiveView = view
  }
}
