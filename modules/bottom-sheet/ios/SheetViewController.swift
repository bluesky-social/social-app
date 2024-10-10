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
      sheet.prefersGrabberVisible = false
    }
  }

  func setDetents(contentHeight: CGFloat, preventExpansion: Bool) -> UISheetPresentationController.Detent.Identifier? {
    guard let sheet = self.sheetPresentationController else {
      return nil
    }

    if contentHeight > Util.getScreenHeight() - 100 {
      sheet.detents = [
        .large()
      ]
      sheet.selectedDetentIdentifier = .large
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

      if !preventExpansion {
        sheet.detents.append(.large())
      }
      sheet.selectedDetentIdentifier = .medium
    }
    return sheet.selectedDetentIdentifier
  }

  func updateDetents(contentHeight: CGFloat, preventExpansion: Bool) -> UISheetPresentationController.Detent.Identifier? {
    var newDetent: UISheetPresentationController.Detent.Identifier?
    if let sheet = self.sheetPresentationController {
      sheet.animateChanges {
        newDetent = self.setDetents(contentHeight: contentHeight, preventExpansion: preventExpansion)
        if #available(iOS 16.0, *) {
          sheet.invalidateDetents()
        }
      }
    }
    return newDetent
  }

  func getCurrentDetentIdentifier() -> UISheetPresentationController.Detent.Identifier? {
    guard let sheet = self.sheetPresentationController else {
      return nil
    }
    return sheet.selectedDetentIdentifier
  }

  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
}
