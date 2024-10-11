//
//  UIView+findFirstResponder.swift
//  Pods
//
//  Created by Hailey on 10/9/24.
//

extension UIView {
  func findFirstResponder() -> UIView? {
    if self.isFirstResponder {
        return self
    }
    for subview in subviews {
      if let responder = subview.findFirstResponder() {
        return responder
      }
    }
    return nil
  }
}
