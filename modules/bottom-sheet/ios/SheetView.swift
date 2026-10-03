import ExpoModulesCore
import React
import UIKit

class SheetView: ExpoView {
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
  private let onPresentationSizeChange = EventDispatcher()
  private var didSeedCanvasSize = false
  private var lastCanvasSize: CGSize?

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
  var containerBackgroundColor: UIColor? {
    didSet {
      self.sheetVc?.setContainerBackgroundColor(containerBackgroundColor)
    }
  }
  var popover: BottomSheetPopoverMode = .never
  var popoverWidth: CGFloat = 320
  var cornerRadius: CGFloat?
  var sourceViewTag: Int?
  var minHeight: CGFloat = 0
  var maxHeight: CGFloat?
  var desiredContentHeight: CGFloat? {
    didSet {
      guard let desiredContentHeight,
            (self.isOpen || self.isOpening),
            !self.isClosing else { return }
      let clampedHeight = self.clampHeight(desiredContentHeight)
      self.sheetVc?.updateContentSize(
        contentHeight: clampedHeight,
        preventExpansion: self.preventExpansion
      )
      self.selectedDetentIdentifier = self.sheetVc?.getCurrentDetentIdentifier()
    }
  }
  private var lastPresentedSize = CGSize.zero
  private var lastPresentedInsets: UIEdgeInsets?
  private var lastPresentedBottomOffset: CGFloat?
  private var lastPresentedIsPopover: Bool?

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

    childComponentView.removeFromSuperview()
    if self.innerView === childComponentView {
      self.innerView = nil
    }
  }

  // We'll grab the content height from here so we know the initial detent to set
  override func layoutSubviews() {
    super.layoutSubviews()
    self.seedCanvasSize()
    self.present()
  }

  private func seedCanvasSize() {
    guard !self.didSeedCanvasSize else { return }
    self.didSeedCanvasSize = true

    let bounds = self.window?.bounds ?? UIScreen.main.bounds
    let horizontalSizeClass =
      self.window?.traitCollection.horizontalSizeClass
        ?? self.traitCollection.horizontalSizeClass
    let canvasWidth: CGFloat
    if self.popover == .always ||
       (self.popover == .adaptive && horizontalSizeClass == .regular) {
      canvasWidth = min(self.popoverWidth, bounds.width)
    } else {
      canvasWidth = bounds.width
    }
    self.updateCanvasSize(width: canvasWidth)
  }

  private func updateCanvasSize(width: CGFloat) {
    let bounds = self.window?.bounds ?? UIScreen.main.bounds
    let safeAreaInsets = self.window?.safeAreaInsets ?? .zero
    let size = CGSize(
      width: width,
      height: max(0, bounds.height - safeAreaInsets.top)
    )
    guard size != self.lastCanvasSize else { return }

    self.lastCanvasSize = size
    self.setViewSize(size)
  }

  private func destroy() {
    let shouldNotifyClosed =
      self.sheetVc != nil || self.isOpen || self.isOpening || self.isClosing
    self.contentHeightObservation?.invalidate()
    self.contentHeightObservation = nil
    if shouldNotifyClosed {
      self.isClosing = false
      self.isOpening = false
      self.isOpen = false
    }
    self.sheetVc = nil
    self.selectedDetentIdentifier = nil
    self.didSeedCanvasSize = false
    self.lastCanvasSize = nil
    self.lastPresentedSize = .zero
    self.lastPresentedInsets = nil
    self.lastPresentedBottomOffset = nil
    self.lastPresentedIsPopover = nil

    if let innerView = self.innerView {
      self.touchHandler?.detach(from: innerView)
    }
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
          contentHeight > 0 || self.fullHeight,
          let rvc = self.reactViewController() else {
      return
    }

    let sheetVc = SheetViewController(
      popoverMode: self.popover,
      popoverWidth: self.popoverWidth,
      preferredCornerRadius: self.cornerRadius,
      containerBackgroundColor: self.containerBackgroundColor
    )
    let clampedContentHeight = self.clampHeight(
      self.desiredContentHeight ?? contentHeight
    )
    sheetVc.setDetents(
      contentHeight: clampedContentHeight,
      preventExpansion: self.preventExpansion,
      fullHeight: self.fullHeight
    )
    sheetVc.onPresentedBoundsChange = { [weak self] size, insets, bottomOffset, isPopover in
      self?.updatePresentedSize(
        size,
        insets: insets,
        bottomOffset: bottomOffset,
        isPopover: isPopover
      )
    }
    sheetVc.onAttemptDismiss = { [weak self] in
      self?.onAttemptDismiss()
    }
    sheetVc.onDetentChange = { [weak self] identifier in
      self?.selectedDetentIdentifier = identifier
    }
    sheetVc.onShouldDismiss = { [weak self] in
      guard let self = self else { return true }
      return !self.preventDismiss
    }
    sheetVc.onWillDismiss = { [weak self] in
      self?.isClosing = true
    }
    sheetVc.onDidDismiss = { [weak self] in
      self?.destroy()
    }
    if let sheet = sheetVc.sheetPresentationController {
      sheet.delegate = sheetVc
      sheet.preferredCornerRadius = self.cornerRadius
      self.selectedDetentIdentifier = sheet.selectedDetentIdentifier
    }
    sheetVc.setContentView(innerView)

    if let popover = sheetVc.popoverPresentationController {
      let sourceView: UIView
      let sourceRect: CGRect

      if let tag = self.sourceViewTag,
         let anchoredView = self.appContext?.findView(withTag: tag, ofType: UIView.self) {
        sourceView = anchoredView
        sourceRect = anchoredView.bounds
      } else {
        sourceView = rvc.view
        sourceRect = CGRect(
          x: sourceView.bounds.midX,
          y: sourceView.bounds.midY,
          width: 1,
          height: 1
        )
      }

      sheetVc.setPopoverSource(sourceView: sourceView, sourceRect: sourceRect)
    }

    if #available(iOS 26.0, *),
       self.popover == .never,
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
  // Calls updateContentSize directly with the observed height rather than going through
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
            self.desiredContentHeight == nil,
            oldBounds.height != newBounds.height,
            newBounds.height > 0 else { return }
      let clampedHeight = self.clampHeight(newBounds.height)
      self.sheetVc?.updateContentSize(
        contentHeight: clampedHeight,
        preventExpansion: self.preventExpansion
      )
      self.selectedDetentIdentifier = self.sheetVc?.getCurrentDetentIdentifier()
    }
  }

  private func updatePresentedSize(
    _ size: CGSize,
    insets: UIEdgeInsets,
    bottomOffset: CGFloat,
    isPopover: Bool
  ) {
    guard size.width > 0, size.height > 0 else { return }
    let sizeChanged = size != self.lastPresentedSize
    let insetsChanged = self.lastPresentedInsets.map {
      abs($0.top - insets.top) > 0.5 ||
        abs($0.right - insets.right) > 0.5 ||
        abs($0.bottom - insets.bottom) > 0.5 ||
        abs($0.left - insets.left) > 0.5
    } ?? true
    let bottomOffsetChanged = self.lastPresentedBottomOffset.map {
      abs($0 - bottomOffset) > 1
    } ?? true
    let presentationKindChanged = self.lastPresentedIsPopover != isPopover
    guard sizeChanged || insetsChanged || bottomOffsetChanged || presentationKindChanged else {
      return
    }

    self.lastPresentedSize = size
    self.lastPresentedInsets = insets
    self.lastPresentedBottomOffset = bottomOffset
    self.lastPresentedIsPopover = isPopover
    // Keep the React canvas tall enough to measure auto-height content beyond
    // the current detent. Only its width follows the actual presentation frame.
    self.updateCanvasSize(width: size.width)
    self.onPresentationSizeChange([
      "width": size.width,
      "height": size.height,
      "isPopover": isPopover,
      "safeAreaInsets": [
        "top": insets.top,
        "right": insets.right,
        "bottom": insets.bottom,
        "left": insets.left
      ],
      "bottomOffset": bottomOffset
    ])
  }

  func dismiss() {
    guard !self.isClosing, let sheetVc = self.sheetVc else {
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
    let availableHeight = self.sheetVc?.availablePresentationHeight ?? {
      let bounds = self.window?.bounds ?? UIScreen.main.bounds
      let insets = self.window?.safeAreaInsets ?? .zero
      return max(1, bounds.height - insets.top - insets.bottom)
    }()
    let maxHeight = min(self.maxHeight ?? availableHeight, availableHeight)
    let minHeight = min(self.minHeight, maxHeight)
    return min(max(height, minHeight), maxHeight)
  }

}
