//
//  SheetManager.swift
//  Pods
//
//  Created by Hailey on 10/1/24.
//

import ExpoModulesCore

class SheetManager {
  static let shared = SheetManager()

  private var sheetViews = NSHashTable<SheetView>(options: .weakMemory)

  func add(_ view: SheetView) {
    sheetViews.add(view)
  }

  func remove(_ view: SheetView) {
    sheetViews.remove(view)
  }

  func dismissAll() {
    sheetViews.allObjects.forEach { sheetView in
      sheetView.dismiss()
    }
  }
}
