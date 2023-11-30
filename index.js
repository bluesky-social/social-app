import 'react-native-gesture-handler' // must be first

import {LogBox} from 'react-native'
LogBox.ignoreLogs(['Require cycle:']) // suppress require-cycle warnings, it's fine

import '#/platform/polyfills'
import {registerRootComponent} from 'expo'
import {doPolyfill} from '#/lib/api/api-polyfill'
doPolyfill()

import App from '#/App'

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App)
