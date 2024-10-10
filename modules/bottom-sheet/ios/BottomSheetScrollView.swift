//
//  BottomSheetScrollView.swift
//  Pods
//
//  Created by Hailey on 10/9/24.
//

class BottomSheetScrollView: UIScrollView, UIScrollViewDelegate {
  private let sheetView: SheetView
  private var previousHeight: CGFloat?
  private var beganDraggingY: CGFloat?
  
  init(sheetView: SheetView) {
    self.sheetView = sheetView
    super.init(frame: .zero)
    if let window = Util.getWindow() {
      self.frame = window.bounds
      let offset = window.safeAreaInsets.bottom * 3
      self.contentInset.bottom = offset
      self.verticalScrollIndicatorInsets.top = 20
      self.verticalScrollIndicatorInsets.bottom = offset
    }
    
    self.delegate = self
    
    NotificationCenter.default.addObserver(self,
                                           selector: #selector(keyboardWillShow(notification:)),
                                           name: UIResponder.keyboardWillShowNotification,
                                           object: nil)
    NotificationCenter.default.addObserver(self,
                                           selector: #selector(keyboardWillHide(notification:)),
                                           name: UIResponder.keyboardWillHideNotification,
                                           object: nil)
  }
  
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
  
  deinit {
    NotificationCenter.default.removeObserver(self)
  }
  
  override func layoutSubviews() {
    super.layoutSubviews()
    
    if let height = self.subviews.first?.frame.size.height,
       self.previousHeight != height,
       let window = self.window {
      let newDetent = self.sheetView.sheetVc.updateDetents(contentHeight: self.sheetView.clampHeight(height),
                                           preventExpansion: self.sheetView.preventExpansion)
      self.sheetView.selectedDetentIdentifier = newDetent
      self.contentSize = CGSize(width: window.bounds.width, height: height)
      self.previousHeight = height
    }
  }

  @objc func keyboardWillShow(notification: Notification) {
    if let keyboardFrame = notification.userInfo?[UIResponder.keyboardFrameEndUserInfoKey] as? CGRect {
      let keyboardHeight = keyboardFrame.height
      let newOffset = self.contentInset.bottom + keyboardHeight
      
      // We purposefully add keyboard height to content inset and only update
      // the scroll indicator inset
      self.contentInset.bottom = newOffset
      self.verticalScrollIndicatorInsets.bottom = keyboardHeight
      
      if let firstResponder = self.findFirstResponder(),
         let window = self.window {
        let position = firstResponder.convert(firstResponder.bounds,
                                                    to: window)
        
        if position.minY > window.bounds.height - keyboardHeight {
          self.setContentOffset(CGPoint(x: 0, y: self.contentOffset.y + keyboardHeight),
                                animated: true)
        }
      }
    }
  }

  @objc func keyboardWillHide(notification: Notification) {
    if let window = Util.getWindow() {
      let offset = window.safeAreaInsets.bottom * 3
      self.contentInset.bottom = offset
      self.verticalScrollIndicatorInsets.bottom = offset
    }
  }
  
  func scrollViewWillBeginDragging(_ scrollView: UIScrollView) {
    self.beganDraggingY = self.contentOffset.y
  }
  
  func scrollViewDidScroll(_ scrollView: UIScrollView) {
    if let beganDraggingY = self.beganDraggingY,
       self.contentOffset.y < beganDraggingY {
      if let firstResponder = self.findFirstResponder() {
        firstResponder.resignFirstResponder()
      }
      self.beganDraggingY = nil
    }
  }
}
