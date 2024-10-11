//
//  Util.swift
//  Pods
//
//  Created by Hailey on 10/2/24.
//

class Util {
  static func getWindow() -> UIWindow? {
    if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
       let window = windowScene.windows.first {
      return window
    }
    return nil
  }
  
  static func getScreenHeight() -> CGFloat {
    if let window = Self.getWindow() {
      let safeAreaInsets = window.safeAreaInsets
      let fullScreenHeight = UIScreen.main.bounds.height
      return fullScreenHeight - (safeAreaInsets.top + safeAreaInsets.bottom)
    }
    return 0
  }
}
