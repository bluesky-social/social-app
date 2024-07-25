import Foundation

class VisibilityViewManager {
  static let shared = VisibilityViewManager()

  let views = NSHashTable<VisibilityView>(options: .weakMemory)

  private var currentlyActiveView: VisibilityView?
  private var screenHeight: CGFloat = UIScreen.main.bounds.height

  func addView(_ view: VisibilityView) {
    self.views.add(view)
  }

  func removeView(_ view: VisibilityView) {
    self.views.remove(view)
  }

  func updateActiveView() {
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
             minY >= 150, // TODO this should do something nicer, like "closest to middle"
             minY < currentlyMostMinY {
            mostVisibleView = view
          }
        }
      }

      activeView = mostVisibleView
    }
    
    if activeView == self.currentlyActiveView {
      return
    }

    self.clearActiveView()
    if let view = activeView {
      self.setActiveView(view)
    }
  }
  
  func clearActiveView() {
    if let currentlyActiveView = self.currentlyActiveView {
      currentlyActiveView.setIsCurrentlyActive(isActive: false)
      self.currentlyActiveView = nil
    }
  }

  func setActiveView(_ view: VisibilityView) {
    view.setIsCurrentlyActive(isActive: true)
    self.currentlyActiveView = view
  }
}
