import 'react-native-gesture-handler' // must be first
import {LogBox} from 'react-native'

import '#/platform/polyfills'
import {IS_TEST} from '#/env'
import {registerRootComponent} from 'expo'
import {doPolyfill} from '#/lib/api/api-polyfill'

import App from '#/App'

doPolyfill()

if (IS_TEST) {
  LogBox.ignoreAllLogs() // suppress all logs in tests
} else {
  LogBox.ignoreLogs(['Require cycle:']) // suppress require-cycle warnings, it's fine
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App)
