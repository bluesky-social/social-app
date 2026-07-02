// eslint-disable-next-line import-x/no-unresolved
import '#/platform/markBundleStartTime'
import '#/platform/polyfills'
// Resolves and stashes the active brand. MUST come before `#/App` so that
// brand-driven module-level constants see a populated brand at first read.
import '#/brand/boot'

import {registerRootComponent} from 'expo'

// eslint-disable-next-line import-x/no-unresolved
import App from '#/App'

registerRootComponent(App)
