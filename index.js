import 'react-native-gesture-handler' // must be first
// Must run before anything that loads a core-js polyfill (core-js enters the
// bundle via @atproto/oauth-client-expo). This makes inspect-source capture
// the *native* Function.prototype.toString. With Metro's inlineRequires,
// core-js's make-built-in.js otherwise wraps Function.prototype.toString
// before inspect-source ever executes, so inspect-source captures the wrapper
// and every later fn.toString() call recurses until Hermes throws
// "RangeError: Maximum call stack size exceeded (native stack depth)".
// See https://github.com/zloirock/core-js/issues/1237
import 'core-js/internals/inspect-source'
import '#/platform/polyfills'

import {LogBox} from 'react-native'
import {registerRootComponent} from 'expo'

import App from '#/App'

if (process.env.NODE_ENV === 'test') {
  LogBox.ignoreAllLogs() // suppress all logs in tests
} else {
  LogBox.ignoreLogs(['Require cycle:']) // suppress require-cycle warnings, it's fine
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App)
