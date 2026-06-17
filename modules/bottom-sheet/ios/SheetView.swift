import ExpoModulesCore
import React
import UIKit

class SheetView: ExpoView, UISheetPresentationControllerDelegate {
  // Views
  private var sheetVc: SheetViewController?
  private var innerView: UIView?
  private var touchHandler: RCTSurfaceTouchHandler?

  // Native content height observation (eliminates JS bridge round-trip)
  private var contentHeightObservation: NSKeyValueObservation?

  // Events
  private let onAttemptDismiss = EventDispatcher()
  private let onSnapPointChange = EventDispatcher()
  private let onStateChange = EventDispatcher()

  // Open event firing
  private var isOpen: Bool = false {
    didSet {
      onStateChange([
        "state": isOpen ? "open" : "closed"
      ])
    }
  }

  // React view props
  var fullHeight = false
  var preventDismiss = false
  var preventExpansion = false
  var cornerRadius: CGFloat?
  var sourceViewTag: Int?
  var minHeight = 0.0
  var maxHeight: CGFloat! {
    didSet {
      let screenHeight = Util.getScreenHeight() ?? 0
      if maxHeight > screenHeight {
        maxHeight = screenHeight
      }
    }
  }

  private var isOpening = false {
    didSet {
      if isOpening {
        onStateChange([
          "state": "opening"
        ])
      }
    }
  }
  private var isClosing = false {
    didSet {
      if isClosing {
        onStateChange([
          "state": "closing"
        ])
      }
    }
  }
  private var selectedDetentIdentifier: UISheetPresentationController.Detent.Identifier? {
    didSet {
      if selectedDetentIdentifier == .large {
        onSnapPointChange([
          "snapPoint": 2
        ])
      } else {
        onSnapPointChange([
          "snapPoint": 1
        ])
      }
    }
  }

  // MARK: - Lifecycle

  required init (appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    self.maxHeight = Util.getScreenHeight()
    self.touchHandler = RCTSurfaceTouchHandler()
    SheetManager.shared.add(self)
  }

  deinit {
    self.destroy()
  }
  
  override func mountChildComponentView(
    _ childComponentView: UIView,
    index: Int
  ) {
    self.innerView = childComponentView
    touchHandler?.attach(to: childComponentView)
  }
  
  override func unmountChildComponentView(
    _ childComponentView: UIView,
    index: Int
  ) {
    touchHandler?.detach(from: childComponentView)
    if self.innerView === childComponentView {
      self.innerView = nil
    }
  }

  // We'll grab the content height from here so we know the initial detent to set
  override func layoutSubviews() {
    super.layoutSubviews()
    self.present()
  }

  private func destroy() {
    self.contentHeightObservation?.invalidate()
    self.contentHeightObservation = nil
    self.isClosing = false
    self.isOpen = false
    self.sheetVc = nil
    self.touchHandler = nil
    self.innerView = nil
    SheetManager.shared.remove(self)
  }

  // MARK: - Presentation

  func present() {
    guard !self.isOpen,
          !self.isOpening,
          !self.isClosing,
          let innerView = self.innerView,
          let contentHeight = innerView.subviews.first?.frame.height,
          let rvc = self.reactViewController() else {
      return
    }

    let sheetVc = SheetViewController()
    sheetVc.setDetents(contentHeight: self.clampHeight(contentHeight), preventExpansion: self.preventExpansion, fullHeight: self.fullHeight)
    if let sheet = sheetVc.sheetPresentationController {
      sheet.delegate = self
      sheet.preferredCornerRadius = self.cornerRadius
      self.selectedDetentIdentifier = sheet.selectedDetentIdentifier
    }
    sheetVc.view.addSubview(innerView)

    if #available(iOS 26.0, *),
       let tag = self.sourceViewTag,
       let sourceView = self.appContext?.findView(withTag: tag, ofType: UIView.self) {
      sheetVc.preferredTransition = .zoom { _ in
        return sourceView
      }
    }

    self.sheetVc = sheetVc
    self.isOpening = true
    if !self.fullHeight {
      self.startObservingContentHeight()
    }

    rvc.present(sheetVc, animated: true) { [weak self] in
      self?.isOpening = false
      self?.isOpen = true
    }
  }

  // Observe the content view's bounds via KVO so that height changes are detected
  // purely on the native side, without a JS bridge round-trip through onLayout.
  // Calls updateDetents directly with the observed height rather than going through
  // updateLayout(), which has a prevLayoutDetentIdentifier guard that can block
  // legitimate content-driven updates when detent identifiers drift during animations.
  private func startObservingContentHeight() {
    self.contentHeightObservation?.invalidate()

    guard let contentView = self.innerView?.subviews.first else { return }

    self.contentHeightObservation = contentView.observe(
      \.bounds,
      options: [.old, .new]
    ) { [weak self] _, change in
      guard let self = self,
            (self.isOpen || self.isOpening) && !self.isClosing,
            let oldBounds = change.oldValue,
            let newBounds = change.newValue,
            oldBounds.height != newBounds.height,
            newBounds.height > 0 else { return }
      let clampedHeight = self.clampHeight(newBounds.height)
      self.sheetVc?.updateDetents(contentHeight: clampedHeight, preventExpansion: self.preventExpansion)
      self.selectedDetentIdentifier = self.sheetVc?.getCurrentDetentIdentifier()
    }
  }

  func dismiss() {
    guard let sheetVc = self.sheetVc else {
      return
    }

    self.isClosing = true
    DispatchQueue.main.async {
      sheetVc.dismiss(animated: true) { [weak self] in
        self?.destroy()
      }
    }
  }

  // MARK: - Utils

  private func clampHeight(_ height: CGFloat) -> CGFloat {
    if height < self.minHeight {
      return self.minHeight
    } else if height > self.maxHeight {
      return self.maxHeight
    }
    return height
  }

  // MARK: - UISheetPresentationControllerDelegate

  func presentationControllerShouldDismiss(_ presentationController: UIPresentationController) -> Bool {
    self.onAttemptDismiss()
    return !self.preventDismiss
  }

  func presentationControllerWillDismiss(_ presentationController: UIPresentationController) {
    self.isClosing = true
  }

  func presentationControllerDidDismiss(_ presentationController: UIPresentationController) {
    self.destroy()
  }

  func sheetPresentationControllerDidChangeSelectedDetentIdentifier(_ sheetPresentationController: UISheetPresentationController) {
    self.selectedDetentIdentifier = sheetPresentationController.selectedDetentIdentifier
  }
}
