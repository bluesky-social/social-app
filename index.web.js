// index.web.js

import 'platform/polyfills'
import {AppRegistry} from 'react-native'
import App from './src/App'
import {name as appName} from './src/app.json'

// register the app
AppRegistry.registerComponent(appName, () => App)

AppRegistry.runApplication(appName, {
  initialProps: {},
  rootTag: document.getElementById('app-root'),
})
