import ExpoModulesCore

/*
 We want to keep track of different views that are actually present on the screen. Of
 those views, we want to tell a _single_ view "hey, start playing that video!".
 
 Things that we know right now:
 - FlatList will remove views that are no longer visible for us - so if we scroll past
   a view or if we switch tabs, the `newWindow` in `willMove` will be nil
 - Because of that, the views that we currently have at our disposal will be the
   "available" views.
 - Whenever a single video is present, that video can play at any time that it is
   visible on-screen.
   However, whenever there is more than one video, we want to give prescedence to the
   video that is "most" on-screen
 
 First, we should probably keep a manager with the available views. This will let us
 run a callback for determining the location of that video on the screen at any time -
 and let us run that same measurment on the other visible views *at the same time*.
 */

class VisibilityView: ExpoView {
  // Props
  var enabled = false {
    didSet {
      if enabled {
        VisibilityViewManager.shared.removeView(self)
      }
    }
  }
  
  // Events
  let onVisibilityChange = EventDispatcher()
  
  var isCurrentlyActiveView = false
  
  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
  }
  
  public override func willMove(toWindow newWindow: UIWindow?) {
    if !self.enabled {
      return
    }
    
    if newWindow == nil {
      VisibilityViewManager.shared.removeView(self)
    } else {
      VisibilityViewManager.shared.addView(self)
    }
  }
  
  func getCurrentPosition() -> CGRect? {
    guard let window = self.window else {
      return nil
    }
    
    return self.convert(self.bounds, to: window)
  }
  
  func setIsCurrentlyActive(isActive: Bool) {
    if isCurrentlyActiveView == isActive {
      return
    }
    
    self.isCurrentlyActiveView = isActive
    self.onVisibilityChange([
      "isVisible": isActive
    ])
  }
}
