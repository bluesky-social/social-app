/* eslint-disable import/no-nodejs-modules -- Expo config plugins run in Node. */
const fs = require('node:fs')
const path = require('node:path')
const {withDangerousMod, CodeGenerator} = require('expo/config-plugins')

/**
 * On iPadOS 26+, windowed apps get close/minimize/arrange controls in the
 * top-leading corner. The default style draws them inline with the app's
 * toolbar and expects the app to lay out around them, which our JS headers
 * can't do, so they end up covering the menu/back button. The minimal style
 * draws them in a strip above the app instead, and that strip counts toward
 * the top safe area, which every screen already respects.
 */
module.exports = config =>
  withDangerousMod(config, [
    'ios',
    config => {
      const file = path.join(
        config.modRequest.platformProjectRoot,
        config.modRequest.projectName,
        'SceneDelegate.swift',
      )
      let contents = fs.readFileSync(file, 'utf8')

      contents = CodeGenerator.mergeContents({
        src: contents,
        anchor: /internal import Expo/,
        newSrc: 'import UIKit',
        offset: 1,
        tag: 'windowing control style import',
        comment: '//',
      }).contents

      contents = CodeGenerator.mergeContents({
        src: contents,
        anchor: /\/\/ Extension point for config plugins\./,
        newSrc: `  @available(iOS 26.0, *)
  @objc(preferredWindowingControlStyleForScene:)
  func preferredWindowingControlStyle(
    for windowScene: UIWindowScene
  ) -> UIWindowScene.WindowingControlStyle {
    return .minimal
  }`,
        offset: 1,
        tag: 'windowing control style',
        comment: '//',
      }).contents

      fs.writeFileSync(file, contents)
      return config
    },
  ])
