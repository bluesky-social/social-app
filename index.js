import 'react-native-gesture-handler' // must be first
import '#/platform/polyfills'
// Resolves and stashes the active brand. MUST come before `#/App` so that
// brand-driven module-level constants see a populated brand at first read.
import '#/brand/boot'

import {LogBox} from 'react-native'
import {registerRootComponent} from 'expo'

// eslint-disable-next-line import-x/no-unresolved
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
