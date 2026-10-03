//
//  SheetViewController.swift
//  Pods
//
//  Created by Hailey on 9/30/24.
//

import Foundation
import UIKit

class SheetViewController: UIViewController,
  UIPopoverPresentationControllerDelegate,
  UISheetPresentationControllerDelegate {
  var onPresentedBoundsChange: ((CGSize, UIEdgeInsets, CGFloat, Bool) -> Void)?
  var onAttemptDismiss: (() -> Void)?
  var onDetentChange: ((UISheetPresentationController.Detent.Identifier?) -> Void)?
  var onShouldDismiss: (() -> Bool)?
  var onWillDismiss: (() -> Void)?
  var onDidDismiss: (() -> Void)?

  private let popoverMode: BottomSheetPopoverMode
  private var usesPopover: Bool { self.popoverMode != .never }
  private let popoverWidth: CGFloat
  private let preferredCornerRadius: CGFloat?
  private var containerBackgroundColor: UIColor?
  private let contentDetentIdentifier = UISheetPresentationController.Detent.Identifier("content")
  private var contentHeight: CGFloat = 0
  private var preventExpansion = false
  private var fullHeight = false
  private var isAdaptedToSheet = false
  private let contentHostView = UIView()
  private weak var contentView: UIView?
  private var popoverContentHostConstraints: [NSLayoutConstraint] = []
  private var sheetContentHostConstraints: [NSLayoutConstraint] = []
  private var contentHostUsesPopoverSafeArea: Bool?
  private var didRefreshDetentsForPresentedBounds = false
  private weak var adaptedSheetPresentationController: UISheetPresentationController?

  init(
    popoverMode: BottomSheetPopoverMode,
    popoverWidth: CGFloat,
    preferredCornerRadius: CGFloat?,
    containerBackgroundColor: UIColor?
  ) {
    self.popoverMode = popoverMode
    self.popoverWidth = popoverWidth
    self.preferredCornerRadius = preferredCornerRadius
    self.containerBackgroundColor = containerBackgroundColor
    super.init(nibName: nil, bundle: nil)

    self.modalPresentationStyle = popoverMode == .never ? .formSheet : .popover
    self.isModalInPresentation = false

    if let sheet = self.sheetPresentationController {
      sheet.prefersGrabberVisible = false
    }
  }

  override func viewDidLoad() {
    super.viewDidLoad()
    self.applyContainerBackgroundColor()
  }

  func setContainerBackgroundColor(_ color: UIColor?) {
    self.containerBackgroundColor = color
    self.applyContainerBackgroundColor()
  }

  private func applyContainerBackgroundColor() {
    guard self.isViewLoaded else { return }
    self.view.backgroundColor = self.containerBackgroundColor
    self.view.isOpaque = (self.containerBackgroundColor?.cgColor.alpha ?? 0) >= 1
  }

  override func viewDidLayoutSubviews() {
    super.viewDidLayoutSubviews()
    self.updateContentHostConstraints()
    /*
     * Popover bounds can include arrow safe-area insets. Report the content host
     * frame so React measures the same usable area that UIKit lays out.
     */
    self.onPresentedBoundsChange?(
      self.presentedContentBounds.size,
      self.presentedContentSafeAreaInsets,
      self.presentationBottomOffset,
      self.isPresentedAsPopover
    )

    guard !self.didRefreshDetentsForPresentedBounds,
          let sheet = self.activeSheetPresentationController
    else {
      return
    }

    self.didRefreshDetentsForPresentedBounds = true
    DispatchQueue.main.async { [weak self, weak sheet] in
      guard let self = self, let sheet = sheet else { return }
      let selectedDetent = sheet.selectedDetentIdentifier
      self.configureDetents(
        on: sheet,
        contentHeight: self.contentHeight,
        preventExpansion: self.preventExpansion,
        fullHeight: self.fullHeight
      )
      if let selectedDetent,
         sheet.detents.contains(where: { $0.identifier == selectedDetent }) {
        sheet.selectedDetentIdentifier = selectedDetent
      }
    }
  }

  func setContentView(_ contentView: UIView) {
    self.contentView = contentView
    self.contentHostView.backgroundColor = .clear
    self.contentHostView.clipsToBounds = true
    self.contentHostView.translatesAutoresizingMaskIntoConstraints = false
    self.view.addSubview(self.contentHostView)
    contentView.translatesAutoresizingMaskIntoConstraints = true
    var contentFrame = contentView.frame
    contentFrame.origin = .zero
    contentView.frame = contentFrame
    self.contentHostView.addSubview(contentView)

    let safeArea = self.view.safeAreaLayoutGuide
    self.popoverContentHostConstraints = [
      self.contentHostView.leadingAnchor.constraint(equalTo: safeArea.leadingAnchor),
      self.contentHostView.trailingAnchor.constraint(equalTo: safeArea.trailingAnchor),
      self.contentHostView.topAnchor.constraint(equalTo: safeArea.topAnchor),
      self.contentHostView.bottomAnchor.constraint(equalTo: safeArea.bottomAnchor),
    ]
    self.sheetContentHostConstraints = [
      self.contentHostView.leadingAnchor.constraint(equalTo: self.view.leadingAnchor),
      self.contentHostView.trailingAnchor.constraint(equalTo: self.view.trailingAnchor),
      self.contentHostView.topAnchor.constraint(equalTo: self.view.topAnchor),
      self.contentHostView.bottomAnchor.constraint(equalTo: self.view.bottomAnchor),
    ]
    self.updateContentHostConstraints()
  }

  private func updateContentHostConstraints() {
    guard self.contentView != nil else { return }
    let usePopoverSafeArea = self.isPresentedAsPopover
    guard self.contentHostUsesPopoverSafeArea != usePopoverSafeArea else { return }

    NSLayoutConstraint.deactivate(
      usePopoverSafeArea
        ? self.sheetContentHostConstraints
        : self.popoverContentHostConstraints
    )
    NSLayoutConstraint.activate(
      usePopoverSafeArea
        ? self.popoverContentHostConstraints
        : self.sheetContentHostConstraints
    )
    self.contentHostUsesPopoverSafeArea = usePopoverSafeArea
  }

  private var presentedContentBounds: CGRect {
    return self.isPresentedAsPopover
      ? self.view.safeAreaLayoutGuide.layoutFrame
      : self.view.bounds
  }

  private var presentedContentSafeAreaInsets: UIEdgeInsets {
    return self.isPresentedAsPopover ? .zero : self.view.safeAreaInsets
  }

  func setPopoverSource(sourceView: UIView, sourceRect: CGRect) {
    guard let popover = self.popoverPresentationController else { return }

    popover.delegate = self
    popover.sourceView = sourceView
    popover.sourceRect = sourceRect
    self.preferredContentSize = CGSize(
      width: self.clampedPopoverWidth,
      height: self.clampedContentHeight(self.contentHeight)
    )
  }

  func setDetents(contentHeight: CGFloat, preventExpansion: Bool, fullHeight: Bool = false) {
    self.contentHeight = contentHeight
    self.preventExpansion = preventExpansion
    self.fullHeight = fullHeight

    guard let sheet = self.activeSheetPresentationController else { return }
    self.configureDetents(
      on: sheet,
      contentHeight: contentHeight,
      preventExpansion: preventExpansion,
      fullHeight: fullHeight
    )
  }

  private func configureDetents(
    on sheet: UISheetPresentationController,
    contentHeight: CGFloat,
    preventExpansion: Bool,
    fullHeight: Bool
  ) {
    let availableHeight = self.availablePresentationHeight
    guard availableHeight > 0 else { return }

    if fullHeight {
      sheet.detents = [.large()]
      sheet.selectedDetentIdentifier = .large
      return
    }

    // On iOS 26, the floaty sheet presentation adds the device bottom safe area
    // on top of the custom detent value, creating visible padding inside the pill.
    // Subtract the presented controller's inset so its visible height matches content.
    let bottomSafeAreaAdjustment: CGFloat
    if #available(iOS 26.0, *) {
      bottomSafeAreaAdjustment = self.presentationSafeAreaInsets.bottom
    } else {
      bottomSafeAreaAdjustment = 0
    }

    let clampedHeight = self.clampedContentHeight(contentHeight)
    let adjustedHeight = max(1, clampedHeight - bottomSafeAreaAdjustment)

    if clampedHeight > availableHeight - 100 {
      sheet.detents = [.large()]
      sheet.selectedDetentIdentifier = .large
    } else {
      sheet.detents = [
        .custom(identifier: self.contentDetentIdentifier) { _ in adjustedHeight }
      ]
      if !preventExpansion {
        sheet.detents.append(.large())
      }
      sheet.selectedDetentIdentifier = self.contentDetentIdentifier
    }
  }

  func updateContentSize(contentHeight: CGFloat, preventExpansion: Bool) {
    self.contentHeight = contentHeight
    self.preventExpansion = preventExpansion

    if let sheet = self.activeSheetPresentationController {
      // Capture `self` weakly to prevent retain cycles.
      // Also, capture `sheet` weakly to avoid potential strong references held by animateChanges.
      sheet.animateChanges { [weak self, weak sheet] in
        guard let weakSelf = self, let weakSheet = sheet else { return }
        weakSelf.setDetents(
          contentHeight: contentHeight,
          preventExpansion: preventExpansion,
          fullHeight: weakSelf.fullHeight
        )
        weakSheet.invalidateDetents()
      }
    } else {
      self.preferredContentSize = CGSize(
        width: self.clampedPopoverWidth,
        height: self.clampedContentHeight(contentHeight)
      )
    }
  }

  func getCurrentDetentIdentifier() -> UISheetPresentationController.Detent.Identifier? {
    return self.activeSheetPresentationController?.selectedDetentIdentifier
  }

  private var activeSheetPresentationController: UISheetPresentationController? {
    if self.usesPopover {
      return self.isAdaptedToSheet ? self.adaptedSheetPresentationController : nil
    }

    return self.sheetPresentationController
      ?? (self.presentationController as? UISheetPresentationController)
  }

  private var isPresentedAsPopover: Bool {
    return self.usesPopover && !self.isAdaptedToSheet
  }

  private var presentationBounds: CGRect {
    let controller = self.activeSheetPresentationController ?? self.presentationController
    if let bounds = controller?.containerView?.bounds,
       !bounds.isEmpty {
      return bounds
    }
    if let bounds = self.presentingViewController?.viewIfLoaded?.bounds,
       !bounds.isEmpty {
      return bounds
    }
    return UIScreen.main.bounds
  }

  private var presentationSafeAreaInsets: UIEdgeInsets {
    if self.viewIfLoaded?.window != nil {
      return self.view.safeAreaInsets
    }
    let controller = self.activeSheetPresentationController ?? self.presentationController
    if let container = controller?.containerView {
      return container.safeAreaInsets
    }
    if let view = self.presentingViewController?.viewIfLoaded {
      return view.safeAreaInsets
    }
    return .zero
  }

  private var presentationBottomOffset: CGFloat {
    guard let window = self.viewIfLoaded?.window else { return 0 }
    let bottom = self.view.convert(
      CGPoint(
        x: self.presentedContentBounds.midX,
        y: self.presentedContentBounds.maxY
      ),
      to: window
    ).y
    return max(0, window.bounds.maxY - bottom)
  }

  var availablePresentationHeight: CGFloat {
    let bounds = self.presentationBounds
    let insets = self.presentationSafeAreaInsets
    return max(1, bounds.height - insets.top - insets.bottom)
  }

  private var clampedPopoverWidth: CGFloat {
    return min(self.popoverWidth, max(1, self.presentationBounds.width))
  }

  private func clampedContentHeight(_ height: CGFloat) -> CGFloat {
    return min(max(1, height), self.availablePresentationHeight)
  }

  func adaptivePresentationStyle(
    for controller: UIPresentationController
  ) -> UIModalPresentationStyle {
    return self.adaptivePresentationStyle(for: controller.traitCollection)
  }

  func adaptivePresentationStyle(
    for controller: UIPresentationController,
    traitCollection: UITraitCollection
  ) -> UIModalPresentationStyle {
    return self.adaptivePresentationStyle(for: traitCollection)
  }

  private func adaptivePresentationStyle(
    for traitCollection: UITraitCollection
  ) -> UIModalPresentationStyle {
    switch self.popoverMode {
    case .always:
      // Keep an anchored popover even when the horizontal size class is compact.
      return .none
    case .adaptive:
      return traitCollection.horizontalSizeClass == .compact ? .formSheet : .none
    case .never:
      return .formSheet
    }
  }

  func presentationControllerShouldDismiss(
    _ presentationController: UIPresentationController
  ) -> Bool {
    self.onAttemptDismiss?()
    return self.onShouldDismiss?() ?? true
  }

  func presentationControllerWillDismiss(
    _ presentationController: UIPresentationController
  ) {
    self.onWillDismiss?()
  }

  func presentationControllerDidDismiss(
    _ presentationController: UIPresentationController
  ) {
    self.onDidDismiss?()
  }

  func presentationController(
    _ presentationController: UIPresentationController,
    prepare adaptivePresentationController: UIPresentationController
  ) {
    guard self.usesPopover,
          let sheet = adaptivePresentationController as? UISheetPresentationController
    else { return }

    /*
     * UIKit can create a different controller for an explicit form-sheet
     * adaptation than popover.adaptiveSheetPresentationController. Configure
     * the controller being presented, not the popover's unused default sheet.
     */
    self.adaptedSheetPresentationController = sheet
    self.isAdaptedToSheet = true
    self.configureAdaptiveSheet(sheet)
  }

  private func configureAdaptiveSheet(_ sheet: UISheetPresentationController) {
    self.didRefreshDetentsForPresentedBounds = false
    sheet.delegate = self
    sheet.preferredCornerRadius = self.preferredCornerRadius
    sheet.prefersGrabberVisible = false
    self.configureDetents(
      on: sheet,
      contentHeight: self.contentHeight,
      preventExpansion: self.preventExpansion,
      fullHeight: self.fullHeight
    )
    self.onDetentChange?(sheet.selectedDetentIdentifier)
  }

  func presentationController(
    _ presentationController: UIPresentationController,
    willPresentWithAdaptiveStyle style: UIModalPresentationStyle,
    transitionCoordinator: UIViewControllerTransitionCoordinator?
  ) {
    guard self.usesPopover else { return }
    guard style == .formSheet || style == .pageSheet else {
      self.isAdaptedToSheet = false
      self.adaptedSheetPresentationController = nil
      self.didRefreshDetentsForPresentedBounds = false
      self.onDetentChange?(nil)
      return
    }

    self.isAdaptedToSheet = true
    if let sheet = self.activeSheetPresentationController {
      self.configureAdaptiveSheet(sheet)
    }
  }

  func sheetPresentationControllerDidChangeSelectedDetentIdentifier(
    _ sheetPresentationController: UISheetPresentationController
  ) {
    self.onDetentChange?(sheetPresentationController.selectedDetentIdentifier)
  }

  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
}
