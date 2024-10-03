import ExpoModulesCore
import UIKit

class SheetView: ExpoView, UISheetPresentationControllerDelegate {
  // Views
  private var sheetVc: SheetViewController?
  private var innerView: UIView?

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

  // MARK: - Lifecycle

  required init (appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    self.maxHeight = Util.getScreenHeight()
    SheetManager.shared.add(self)
  }

  deinit {
    self.destroy()
  }

  // We don't want this view to actually get added to the tree, so we'll simply store it for adding
  // to the SheetViewController
  override func insertReactSubview(_ subview: UIView!, at atIndex: Int) {
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

    self.present(contentHeight: innerView.subviews[0].frame.size.height)
  }

  private func destroy() {
    self.isClosing = false
    self.isOpen = false
    self.sheetVc = nil
    self.innerView = nil
    SheetManager.shared.remove(self)
  }

  // MARK: - Presentation

  func present(contentHeight: CGFloat) {
    guard !self.isOpen,
          let innerView = self.innerView,
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

    rvc.present(sheetVc, animated: true) { [weak self] in
      self?.isOpening = false
      self?.isOpen = true
    }
  }

  func updateLayout() {
    if let contentHeight = self.innerView?.subviews[0].frame.size.height {
      self.sheetVc?.updateDetents(contentHeight: self.clampHeight(contentHeight),
                               preventExpansion: self.preventExpansion)
    }
  }

  func dismiss() {
    self.isClosing = true
    self.sheetVc?.dismiss(animated: true) { [weak self] in
      self?.destroy()
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
