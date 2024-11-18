//
//  IsAnimatedImage.swift
//  Pods
//
//  Created by Hailey on 10/27/24.
//

import SDWebImage

class ImageInfo {
  static func isAnimatedImage(url: URL) -> Bool {
    var path: String
    if #available(iOS 16.0, *) {
      path = url.path()
    } else {
      path = url.path
    }
    
    let image = SDAnimatedImage(contentsOfFile: path)
    return image?.sd_isAnimated ?? false
  }
}
