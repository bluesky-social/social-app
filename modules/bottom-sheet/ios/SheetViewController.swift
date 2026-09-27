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

  private let usesPopover: Bool
  private let popoverWidth: CGFloat
  private let preferredCornerRadius: CGFloat?
  private let contentDetentIdentifier = UISheetPresentationController.Detent.Identifier("content")
  private var contentHeight: CGFloat = 0
  private var preventExpansion = false
  private var fullHeight = false
  private var isAdaptedToSheet = false
  private var didRefreshDetentsForPresentedBounds = false
  private weak var adaptedSheetPresentationController: UISheetPresentationController?

  init(popover: Bool, popoverWidth: CGFloat, preferredCornerRadius: CGFloat?) {
    self.usesPopover = popover
    self.popoverWidth = popoverWidth
    self.preferredCornerRadius = preferredCornerRadius
    super.init(nibName: nil, bundle: nil)

    self.modalPresentationStyle = popover ? .popover : .formSheet
    self.isModalInPresentation = false

    if let sheet = self.sheetPresentationController {
      sheet.prefersGrabberVisible = false
    }
  }

  override func viewDidLayoutSubviews() {
    super.viewDidLayoutSubviews()
    // The popover presentation frame includes the arrow outside React's content.
    self.onPresentedBoundsChange?(
      self.view.bounds.size,
      self.view.safeAreaInsets,
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
      CGPoint(x: self.view.bounds.midX, y: self.view.bounds.maxY),
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
    return controller.traitCollection.horizontalSizeClass == .compact ? .formSheet : .none
  }

  func adaptivePresentationStyle(
    for controller: UIPresentationController,
    traitCollection: UITraitCollection
  ) -> UIModalPresentationStyle {
    return traitCollection.horizontalSizeClass == .compact ? .formSheet : .none
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
