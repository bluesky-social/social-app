import 'react-native-gesture-handler'
import '#/platform/polyfills'

import {LogBox} from 'react-native'

if (process.env.NODE_ENV === 'test') {
  LogBox.ignoreAllLogs()
} else {
  LogBox.ignoreLogs(['Require cycle:'])
}
