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
    DispatchQueue.main.async {
      var activeView: VisibilityView?
      
      print(self.views.count)

      if self.views.count == 1 {
        let view = self.views.allObjects[0]
        if view.isViewableEnough() {
          activeView = view
        }
      } else if self.views.count > 1 {
        let views = self.views.allObjects
        var mostVisibleView: VisibilityView?
        var mostVisiblePosition: CGRect?

        views.forEach { view in
          if !view.isViewableEnough() {
            return
          }
          
          guard let position = view.getPositionOnScreen() else {
            return
          }
          
          print(position.minY)

          if mostVisibleView == nil {
            mostVisibleView = view
            mostVisiblePosition = position
          } else if let mostVisiblePositionUw = mostVisiblePosition,
                    position.minY >= 150,
                    position.minY < mostVisiblePositionUw.minY {
            mostVisibleView = view
            mostVisiblePosition = position
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
