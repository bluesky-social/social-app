import ExpoModulesCore
import React
import UIKit

class SheetView: ExpoView, UISheetPresentationControllerDelegate {
  // Views
  private var sheetVc: SheetViewController?
  private var innerView: UIView?
  private var touchHandler: RCTTouchHandler?

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
  var preventDismiss = false
  var preventExpansion = false
  var cornerRadius: CGFloat?
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
  private var prevLayoutDetentIdentifier: UISheetPresentationController.Detent.Identifier?

  // MARK: - Lifecycle

  required init (appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    self.maxHeight = Util.getScreenHeight()
    self.touchHandler = RCTTouchHandler(bridge: appContext?.reactBridge)
    SheetManager.shared.add(self)
  }

  deinit {
    self.destroy()
  }

  // We don't want this view to actually get added to the tree, so we'll simply store it for adding
  // to the SheetViewController
  override func insertReactSubview(_ subview: UIView!, at atIndex: Int) {
    self.touchHandler?.attach(to: subview)
    self.innerView = subview
  }

  // We'll grab the content height from here so we know the initial detent to set
  override func layoutSubviews() {
    super.layoutSubviews()

    guard let innerView = self.innerView else {
      return
    }

    if innerView.subviews.count != 1 {
      return
    }

    self.present()
  }

  private func destroy() {
    self.contentHeightObservation?.invalidate()
    self.contentHeightObservation = nil
    self.isClosing = false
    self.isOpen = false
    self.sheetVc = nil
    self.touchHandler?.detach(from: self.innerView)
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
    sheetVc.setDetents(contentHeight: self.clampHeight(contentHeight), preventExpansion: self.preventExpansion)
    if let sheet = sheetVc.sheetPresentationController {
      sheet.delegate = self
      sheet.preferredCornerRadius = self.cornerRadius
      self.selectedDetentIdentifier = sheet.selectedDetentIdentifier
    }
    sheetVc.view.addSubview(innerView)

    self.sheetVc = sheetVc
    self.isOpening = true
    self.startObservingContentHeight()

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

  func updateLayout() {
    // Allow updates either when identifiers match OR when prevLayoutDetentIdentifier is nil (first real content update)
    if self.prevLayoutDetentIdentifier == self.selectedDetentIdentifier || self.prevLayoutDetentIdentifier == nil,
       let contentHeight = self.innerView?.subviews.first?.frame.size.height {
      self.sheetVc?.updateDetents(contentHeight: self.clampHeight(contentHeight),
                                  preventExpansion: self.preventExpansion)
      self.selectedDetentIdentifier = self.sheetVc?.getCurrentDetentIdentifier()
    }
    self.prevLayoutDetentIdentifier = self.selectedDetentIdentifier
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
