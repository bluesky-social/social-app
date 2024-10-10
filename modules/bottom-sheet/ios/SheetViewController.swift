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

  func setDetents(initialHeight: String, contentHeight: CGFloat, preventExpansion: Bool) {
    guard let sheet = self.sheetPresentationController,
      let screenHeight = Util.getScreenHeight()
    else {
      return
    }

    if contentHeight > screenHeight - 100 {
      if initialHeight == "half" {
        sheet.detents = [
          .medium(),
          .large(),
        ]
        sheet.selectedDetentIdentifier = .medium
      } else {
        sheet.detents = [
          .large()
        ]
        sheet.selectedDetentIdentifier = .large
      }
    } else {
      if initialHeight == "full" {
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

          if initialHeight == "half" {
            if (screenHeight - 100) / 2 > contentHeight {
              sheet.detents.insert(.medium(), at: 0)
            } else {
              sheet.detents.append(.medium())
            }
          }
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
    }
  }

  func updateDetents(initialHeight: String, contentHeight: CGFloat, preventExpansion: Bool) {
    if let sheet = self.sheetPresentationController {
      sheet.animateChanges {
        self.setDetents(
          initialHeight: initialHeight, contentHeight: contentHeight,
          preventExpansion: preventExpansion)
        if #available(iOS 16.0, *) {
          sheet.invalidateDetents()
        }
      }
    }
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
