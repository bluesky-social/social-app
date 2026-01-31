import '@expo/metro-runtime'
import '#/platform/markBundleStartTime'
import '#/platform/polyfills'

import {registerRootComponent} from 'expo'

import App from '#/App'

registerRootComponent(App)
