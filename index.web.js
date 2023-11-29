import '#/platform/polyfills'
import {registerRootComponent} from 'expo'
import {doPolyfill} from '#/lib/api/api-polyfill'
doPolyfill()
import App from '#/App'
registerRootComponent(App)
