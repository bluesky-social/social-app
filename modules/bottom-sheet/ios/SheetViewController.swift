//
//  SheetViewController.swift
//  Pods
//
//  Created by Hailey on 9/30/24.
//

import Foundation
import UIKit

class SheetViewController: UIViewController {
  init() {
    super.init(nibName: nil, bundle: nil)

    self.modalPresentationStyle = .formSheet
    self.isModalInPresentation = false

    if let sheet = self.sheetPresentationController {
      sheet.prefersGrabberVisible = true
    }
  }

  func setDetents(contentHeight: CGFloat, preventExpansion: Bool) {
    guard let sheet = self.sheetPresentationController,
          let screenHeight = Util.getScreenHeight()
    else {
      return
    }

    if contentHeight > screenHeight {
      sheet.detents = [
        .large()
      ]
    } else {
      if #available(iOS 16.0, *) {
        sheet.detents = [
          .custom { _ in
            return contentHeight
          }
        ]
      } else {
        sheet.detents = [
          .medium()
        ]
      }
    }

    if !preventExpansion {
      sheet.detents.append(.large())
    }
  }

  func updateDetents(contentHeight: CGFloat, preventExpansion: Bool) {
    if let sheet = self.sheetPresentationController {
      sheet.animateChanges {
        self.setDetents(contentHeight: contentHeight, preventExpansion: preventExpansion)
        if #available(iOS 16.0, *) {
          sheet.invalidateDetents()
        }
      }
    }
  }

  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
}
