import '#/platform/markBundleStartTime'
import '#/platform/polyfills'

import {registerRootComponent} from 'expo'

import {doPolyfill} from '#/lib/api/api-polyfill'
import App from '#/App'

doPolyfill()
registerRootComponent(App)
