import ExpoModulesCore
import UIKit

/// Native view that hosts the children and attaches a
/// `UIContextMenuInteraction`. JS-shipped props drive behaviour:
/// - `preview`: discriminated union describing what to show during peek
/// - `menuItems`: array of menu item specs (see `MenuBuilder`)
/// - `previewCornerRadius`: used for the targeted preview's visible path so the
///   lift animation matches the thumbnail's clipping. (Named distinctly from
///   the RN-owned `borderRadius` style prop on UIView.)
class ExpoBlueskyContextMenuView: ExpoView, UIContextMenuInteractionDelegate {
  private var preview: [String: Any]?
  private var menuItems: [[String: Any]] = []
  private var previewCornerRadius: CGFloat = 0

  private let onItemPress = EventDispatcher()
  private let onPreviewPress = EventDispatcher()

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    let interaction = UIContextMenuInteraction(delegate: self)
    self.addInteraction(interaction)
  }

  func setPreview(_ value: [String: Any]?) { self.preview = value }
  func setMenuItems(_ value: [[String: Any]]) { self.menuItems = value }
  func setPreviewCornerRadius(_ value: Double) {
    self.previewCornerRadius = CGFloat(value)
  }

  // MARK: - UIContextMenuInteractionDelegate

  func contextMenuInteraction(
    _ interaction: UIContextMenuInteraction,
    configurationForMenuAtLocation location: CGPoint
  ) -> UIContextMenuConfiguration? {
    let previewSpec = self.preview
    let items = self.menuItems

    return UIContextMenuConfiguration(
      identifier: nil,
      previewProvider: { [weak self] in
        guard self != nil else { return nil }
        return PreviewFactory.makeController(from: previewSpec)
      },
      actionProvider: { [weak self] _ in
        guard let self = self else { return nil }
        return MenuBuilder.build(items: items) { [weak self] id in
          self?.onItemPress(["id": id])
        }
      }
    )
  }

  func contextMenuInteraction(
    _ interaction: UIContextMenuInteraction,
    previewForHighlightingMenuWithConfiguration configuration: UIContextMenuConfiguration
  ) -> UITargetedPreview? {
    return makeTargetedPreview()
  }

  // NOTE: Intentionally not implementing
  // `previewForDismissingMenuWithConfiguration`. iOS reverses the highlight
  // animation by default, which interpolates size + position together. Supplying
  // a separate dismiss preview tends to produce a two-stage animation on
  // aspect-mismatched thumbnails (snap to original size, then translate).

  func contextMenuInteraction(
    _ interaction: UIContextMenuInteraction,
    willPerformPreviewActionForMenuWith configuration: UIContextMenuConfiguration,
    animator: UIContextMenuInteractionCommitAnimating
  ) {
    self.onPreviewPress([:])
  }

  // MARK: - Targeted preview

  /// The targeted preview uses the view itself as target with a rounded-corner
  /// visible path matching the thumbnail's clipping, so the lift animation
  /// respects the existing corner radius.
  private func makeTargetedPreview() -> UITargetedPreview {
    let parameters = UIPreviewParameters()
    parameters.backgroundColor = .clear
    if previewCornerRadius > 0 {
      parameters.visiblePath = UIBezierPath(
        roundedRect: self.bounds,
        cornerRadius: previewCornerRadius
      )
    }
    return UITargetedPreview(view: self, parameters: parameters)
  }
}
