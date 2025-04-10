import 'react-native-gesture-handler' // must be first
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
