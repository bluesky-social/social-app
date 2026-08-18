/*
 * Replacement for react-native-reanimated's js-reanimated/webUtils.web.js,
 * wired up via a webpack alias in webpack.config.js.
 *
 * The original file declares ES module exports but populates them with bare
 * CommonJS `require()` calls wrapped in try/catch. Webpack parses the file as
 * ESM and therefore leaves those `require`s untouched, so in the browser they
 * throw ReferenceError, the try/catch swallows it, and createReactDOMStyle &
 * co. stay undefined. That silently disables reanimated's DOM update path and
 * _updatePropsJS later crashes with "Cannot convert undefined or null to
 * object" on Object.keys(component.props). Importing the same react-native-web
 * internals statically fixes the resolution.
 */
import createReactDOMStyle from 'react-native-web/dist/exports/StyleSheet/compiler/createReactDOMStyle'
import {
  createTextShadowValue,
  createTransformValue,
} from 'react-native-web/dist/exports/StyleSheet/preprocess'

export {createReactDOMStyle, createTextShadowValue, createTransformValue}
