import ExpoModulesCore
import React

class ExpoScrollEdgeInteractionView: ExpoView {
  var nodeHandle: Int? {
    didSet {
      setupInteraction()
    }
  }

  var scrollViewTag: Int? {
    didSet {
      setupInteraction()
    }
  }

  var edge: String? {
    didSet {
      setupInteraction()
    }
  }

  private var currentInteraction: NSObject?

  private func setupInteraction() {
    guard #available(iOS 26.0, *) else { return }

    // Clean up old interaction
    if let interaction = currentInteraction as? UIScrollEdgeElementContainerInteraction,
       let headerView = findHeaderView() {
      headerView.removeInteraction(interaction)
      currentInteraction = nil
    }

    guard let nodeHandle = nodeHandle,
          let scrollViewTag = scrollViewTag
    else { return }

    guard let headerView = appContext?.findView(withTag: nodeHandle, ofType: UIView.self) else {
      return
    }

    // RCTScrollView wraps a UIScrollView — get the inner one
    let scrollView: UIScrollView?
    if let rctScrollView = appContext?.findView(withTag: scrollViewTag, ofType: RCTScrollView.self) {
      scrollView = rctScrollView.scrollView
    } else {
      scrollView = appContext?.findView(withTag: scrollViewTag, ofType: UIScrollView.self)
    }

    guard let scrollView = scrollView else { return }

    let interaction = UIScrollEdgeElementContainerInteraction()
    interaction.edge = resolveEdge()
    interaction.scrollView = scrollView
    headerView.addInteraction(interaction)
    currentInteraction = interaction
  }

  private func resolveEdge() -> NSDirectionalRectEdge {
    switch edge {
    case "bottom": return .bottom
    case "left": return .leading
    case "right": return .trailing
    default: return .top
    }
  }

  private func findHeaderView() -> UIView? {
    guard let nodeHandle = nodeHandle else { return nil }
    return appContext?.findView(withTag: nodeHandle, ofType: UIView.self)
  }
}
