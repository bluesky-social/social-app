import ExpoModulesCore

/**
 * A plain container that registers itself as the zoom source for
 * `identifier`. Its own frame and corner radius are what UIKit zooms from.
 */
class ZoomTransitionSourceView: ExpoView {
  var identifier: String? {
    didSet {
      guard identifier != oldValue else {
        return
      }
      if let oldValue {
        ZoomTransitionRegistry.shared.remove(self, for: oldValue)
      }
      if let identifier, !identifier.isEmpty {
        ZoomTransitionRegistry.shared.add(self, for: identifier)
      }
    }
  }
}
