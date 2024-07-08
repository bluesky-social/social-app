import Foundation

class VisibilityViewManager {
  static let shared = VisibilityViewManager()
  
  let views = NSHashTable<VisibilityView>(options: .weakMemory)
  
  private var timer: Timer?
  
  private var currentlyActiveView: VisibilityView?
  
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
    var activeView: VisibilityView? = nil
    
    print("interval")
    
    if self.views.count == 0 {
      // Do nothing
    } else if self.views.count == 1 {
      activeView = self.views.allObjects[0]
    } else {
      let views = self.views.allObjects
      activeView = views[0]
    }
    
    print(activeView?.reactTag)
    
    if let view = activeView, view != self.currentlyActiveView {
      self.setActiveView(view)
    }
  }
  
  func setActiveView(_ view: VisibilityView) {
    if let currentlyActiveView = self.currentlyActiveView {
      currentlyActiveView.setIsCurrentlyActive(isActive: false)
    }
    view.setIsCurrentlyActive(isActive: true)
    self.currentlyActiveView = view
  }
}
