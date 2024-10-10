import ExpoModulesCore
import UIKit

class SheetView: ExpoView, UISheetPresentationControllerDelegate {
  // Views
  var sheetVc: SheetViewController!
  private var innerView: UIView?
  
  // Scroll view
  private var scrollView: BottomSheetScrollView!
  
  // Touch handler
  private var touchHandler: RCTTouchHandler?

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
  var containerBackgroundColor: UIColor? {
    didSet {
      self.scrollView.backgroundColor = containerBackgroundColor
    }
  }
  var cornerRadius: CGFloat?
  var minHeight = 0.0
  var maxHeight: CGFloat = Util.getScreenHeight() {
    didSet {
      let screenHeight = Util.getScreenHeight()
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
  
  var selectedDetentIdentifier: UISheetPresentationController.Detent.Identifier? {
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
    
    self.sheetVc = SheetViewController()
    if let sheet = self.sheetVc.sheetPresentationController {
      sheet.delegate = self
    }
    
    self.scrollView = BottomSheetScrollView(sheetView: self)
    self.sheetVc.view.addSubview(self.scrollView)
    
    self.touchHandler = RCTTouchHandler(bridge: appContext?.reactBridge)
        
    SheetManager.shared.add(self)
  }

  deinit {
    self.destroy()
  }

  override func insertReactSubview(_ subview: UIView!, at atIndex: Int) {
    self.touchHandler?.attach(to: subview)
    self.scrollView.addSubview(subview)
    self.innerView = subview
    self.present()
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    self.present()
  }

  private func destroy() {
    self.touchHandler?.detach(from: self.innerView)
    self.touchHandler = nil
    self.isClosing = false
    self.isOpen = false
    SheetManager.shared.remove(self)
  }

  // MARK: - Presentation

  func present() {
    guard !self.isOpen,
          !self.isOpening,
          !self.isClosing,
          let rvc = self.reactViewController() else {
      return
    }

    if let sheet = sheetVc.sheetPresentationController {
      sheet.preferredCornerRadius = self.cornerRadius
      self.selectedDetentIdentifier = sheet.selectedDetentIdentifier
    }

    self.isOpening = true

    rvc.present(sheetVc, animated: true) { [weak self] in
      self?.isOpening = false
      self?.isOpen = true
    }
  }

  func dismiss() {
    self.isClosing = true
    self.sheetVc.dismiss(animated: true) { [weak self] in
      self?.destroy()
    }
  }

  // MARK: - Utils

  func clampHeight(_ height: CGFloat) -> CGFloat {
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
