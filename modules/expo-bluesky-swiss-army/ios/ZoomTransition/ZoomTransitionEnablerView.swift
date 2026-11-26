import ExpoModulesCore
import UIKit
import UIKit.UIGestureRecognizerSubclass

/**
 * State shared with the closures UIKit keeps hold of. The closures must not
 * capture the view itself: when JS pops the screen, React unmounts this view
 * before UIKit asks for the source view to zoom back into.
 */
private final class ZoomTransitionState {
  var sourceIdentifier: String?
  var dismissGesture: ZoomDismissGesture = .default
}

/**
 * Rendered inside the destination screen. Sets a zoom `preferredTransition`
 * on the screen's view controller, zooming out of whichever registered source
 * matches `sourceIdentifier`. The source is looked up again when popping, so
 * changing `sourceIdentifier` while the screen is open changes where the pop
 * zooms back into.
 */
class ZoomTransitionEnablerView: ExpoView {
  private let state = ZoomTransitionState()
  private weak var configuredController: UIViewController?
  private var configuredDismissGesture: ZoomDismissGesture?

  var sourceIdentifier: String? {
    didSet {
      state.sourceIdentifier = sourceIdentifier
    }
  }

  var dismissGesture: ZoomDismissGesture = .default {
    didSet {
      state.dismissGesture = dismissGesture
      if dismissGesture != oldValue {
        configureSoon()
      }
    }
  }

  override func didMoveToSuperview() {
    super.didMoveToSuperview()
    configureSoon()
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    configure()
  }

  /*
   * Mounting attaches this view before its ancestors reach the screen, so the
   * view controller only becomes reachable a tick later. That is still before
   * UIKit starts the push animation.
   */
  private func configureSoon() {
    guard superview != nil else {
      return
    }
    DispatchQueue.main.async { [weak self] in
      self?.configure()
    }
  }

  private func configure() {
    #if os(iOS)
    // See the README for why this is iOS 26+ even though the API is iOS 18+
    guard #available(iOS 26.0, *), superview != nil, let controller = findScreenController() else {
      return
    }
    if controller === configuredController && configuredDismissGesture == state.dismissGesture {
      return
    }
    configuredController = controller
    configuredDismissGesture = state.dismissGesture

    let state = self.state
    let options = UIViewController.Transition.ZoomOptions()
    options.interactiveDismissShouldBegin = { [weak controller] context in
      let shouldBegin: Bool
      switch state.dismissGesture {
      case .default:
        shouldBegin = context.willBegin
      case .horizontal:
        shouldBegin = context.velocity.dx > abs(context.velocity.dy)
      case .none:
        shouldBegin = false
      }
      if shouldBegin, let view = controller?.view {
        ZoomTransitionEnablerView.cancelReactTouches(above: view)
      }
      return shouldBegin
    }
    controller.preferredTransition = .zoom(options: options) { context in
      guard
        let identifier = state.sourceIdentifier,
        let container = context.sourceViewController.viewIfLoaded
      else {
        return nil
      }
      return ZoomTransitionRegistry.shared.source(for: identifier, in: container)
    }
    #endif
  }

  /**
   * Cancels the React Native touches in progress, like react-native-screens
   * does when its back gesture starts. UIKit's zoom dismiss gestures don't
   * cancel them, and since the screen moves with the finger, the touch never
   * leaves whatever it started on: releasing the swipe would press it.
   * Toggling the surface's touch handler sends JS a touch cancel.
   */
  private static func cancelReactTouches(above view: UIView) {
    guard let touchHandlerClass = NSClassFromString("RCTSurfaceTouchHandler") else {
      return
    }
    var ancestor = view.superview
    while let current = ancestor {
      if let touchHandler = current.gestureRecognizers?.first(where: { $0.isKind(of: touchHandlerClass) }) {
        touchHandler.isEnabled = false
        touchHandler.isEnabled = true
        touchHandler.reset()
        return
      }
      ancestor = current.superview
    }
  }

  /**
   * The nearest react-native-screens screen controller, found by class name so
   * this module doesn't need to link RNScreens.
   */
  private func findScreenController() -> UIViewController? {
    let screenClass: AnyClass? = NSClassFromString("RNSScreen")
    var responder: UIResponder? = self
    while let current = responder {
      if let controller = current as? UIViewController {
        if let screenClass {
          if controller.isKind(of: screenClass) {
            return controller
          }
        } else {
          return controller
        }
      }
      responder = current.next
    }
    return nil
  }
}
