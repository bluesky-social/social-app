import ExpoModulesCore
import SwiftUI

// Thanks to Andrew Levy for this code snippet
// https://github.com/andrew-levy/swiftui-react-native/blob/d3fbb2abf07601ff0d4b83055e7717bb980910d6/ios/Common/ExpoView%2BUIHostingController.swift

extension ExpoView {
  func setupHostingController(_ hostingController: UIHostingController<some View>) {
    hostingController.view.translatesAutoresizingMaskIntoConstraints = false
    hostingController.view.backgroundColor = .clear

    addSubview(hostingController.view)
    NSLayoutConstraint.activate([
      hostingController.view.topAnchor.constraint(equalTo: self.topAnchor),
      hostingController.view.bottomAnchor.constraint(equalTo: self.bottomAnchor),
      hostingController.view.leftAnchor.constraint(equalTo: self.leftAnchor),
      hostingController.view.rightAnchor.constraint(equalTo: self.rightAnchor),
    ])
  }
}
