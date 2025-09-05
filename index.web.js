import '#/platform/markBundleStartTime'
import '#/platform/polyfills'

import {registerRootComponent} from 'expo'

import App from '#/App'

const splash = document.querySelector('#splash')
if (splash) {
  splash.classList.add('animate-splash')
  setTimeout(() => {
    splash.remove()
  }, 500)
}

registerRootComponent(App)
