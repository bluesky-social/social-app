import UIKit

/**
 * Weakly tracks the views that can act as zoom sources, keyed by identifier.
 * The same identifier can be registered more than once (for example the same
 * post in two tabs), so lookups are scoped to the screen being zoomed from.
 * Only touched from the main thread.
 */
final class ZoomTransitionRegistry {
  static let shared = ZoomTransitionRegistry()

  private var sources: [String: NSHashTable<UIView>] = [:]

  func add(_ view: UIView, for identifier: String) {
    let views = sources[identifier] ?? NSHashTable<UIView>.weakObjects()
    views.add(view)
    sources[identifier] = views
  }

  func remove(_ view: UIView, for identifier: String) {
    guard let views = sources[identifier] else {
      return
    }
    views.remove(view)
    if views.allObjects.isEmpty {
      sources.removeValue(forKey: identifier)
    }
  }

  /**
   * Returns an on-screen source view for `identifier` that lives inside
   * `container`. Views that are off-window or scrolled off-screen (e.g. a
   * card further along a horizontal carousel) are skipped, so UIKit falls back
   * to its default zoom rather than flying to somewhere the user can't see.
   */
  func source(for identifier: String, in container: UIView) -> UIView? {
    guard let views = sources[identifier]?.allObjects else {
      return nil
    }
    return views.first { view in
      guard let window = view.window, view.isDescendant(of: container) else {
        return false
      }
      let frame = view.convert(view.bounds, to: window)
      return frame.intersects(window.bounds)
    }
  }
}
