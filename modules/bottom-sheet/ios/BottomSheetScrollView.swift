//
//  BottomSheetScrollView.swift
//  Pods
//
//  Created by Hailey on 10/9/24.
//

class BottomSheetScrollView: UIScrollView, UIScrollViewDelegate {
  private var previousHeight: CGFloat?
  
  init() {
    super.init(frame: .zero)
    if let window = Util.getWindow() {
      self.frame = window.bounds
      self.contentInset = UIEdgeInsets(top: 0,
                                       left: 0,
                                       bottom: window.safeAreaInsets.bottom,
                                       right: 0)
    }
  }
  
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
  
  override func layoutSubviews() {
    super.layoutSubviews()
    
    if let height = self.subviews.first?.frame.size.height,
       self.previousHeight != height,
       let window = self.window {
      self.contentSize = CGSize(width: window.bounds.width, height: height + window.safeAreaInsets.bottom)
    }
  }
}
