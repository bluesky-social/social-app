/*
 * Web stub for `react-native/Libraries/Utilities/codegenNativeComponent`.
 *
 * Deep `react-native/*` imports bypass the `react-native$ -> react-native-web`
 * alias and drag RN core into the web bundle, where its platform-extension
 * modules (e.g. Libraries/Utilities/Platform.js) resolve to themselves and
 * throw a TDZ error at startup. Packages that import codegen specs
 * unconditionally (react-native-uitextview) guard the native component behind
 * a `Platform.OS === 'ios'` check, so nothing ever renders this on web.
 */
module.exports = function codegenNativeComponent(componentName) {
  return function UnimplementedNativeComponent() {
    throw new Error(
      `Native component "${componentName}" was rendered on web. It has no web implementation.`,
    )
  }
}
