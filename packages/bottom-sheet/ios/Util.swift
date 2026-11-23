//
//  Util.swift
//  Pods
//
//  Created by Hailey on 10/2/24.
//

class Util {
  static func getScreenHeight() -> CGFloat? {
    if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
     let window = windowScene.windows.first {
      let safeAreaInsets = window.safeAreaInsets
      let fullScreenHeight = UIScreen.main.bounds.height
      return fullScreenHeight - (safeAreaInsets.top + safeAreaInsets.bottom)
    }
    return nil
  }
}
