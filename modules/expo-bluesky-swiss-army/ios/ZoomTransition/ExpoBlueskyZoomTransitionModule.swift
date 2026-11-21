import ExpoModulesCore

/**
 * Native pieces for the iOS 18+ zoom navigation transition
 * (`UIViewController.preferredTransition = .zoom`). Based on expo-router's
 * `Link.AppleZoom`, without the router.
 *
 * - `ZoomTransitionSourceView` wraps the view the screen zooms out of.
 * - `ZoomTransitionEnablerView` goes inside the destination screen and turns
 *   the transition on for that screen's view controller.
 */
public class ExpoBlueskyZoomTransitionModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoBlueskyZoomTransition")

    View(ZoomTransitionSourceView.self) {
      Prop("identifier") { (view: ZoomTransitionSourceView, identifier: String?) in
        view.identifier = identifier
      }
    }

    View(ZoomTransitionEnablerView.self) {
      Prop("sourceIdentifier") { (view: ZoomTransitionEnablerView, identifier: String?) in
        view.sourceIdentifier = identifier
      }

      Prop("dismissGesture") { (view: ZoomTransitionEnablerView, gesture: ZoomDismissGesture?) in
        view.dismissGesture = gesture ?? .default
      }
    }
  }
}

enum ZoomDismissGesture: String, Enumerable {
  /** UIKit's own behaviour: swipe down, pinch, or swipe from the edge. */
  case `default`
  /** Only gestures that start out moving right, like a back swipe. */
  case horizontal
  /** No interactive dismissal, only the back button. */
  case none
}
