import {init, SessionStrategy} from '@bitdrift/react-native'
import {Statsig} from 'statsig-react-native-expo'

import {initPromise} from './statsig/statsig'

export {debug, error, info, warn} from '@bitdrift/react-native'

const BITDRIFT_API_KEY = process.env.BITDRIFT_API_KEY

initPromise.then(() => {
  let isEnabled = false
  let isNetworkEnabled = false
  try {
    if (Statsig.checkGate('enable_bitdrift_v2')) {
      isEnabled = true
    }
    if (Statsig.checkGate('enable_bitdrift_v2_networking')) {
      isNetworkEnabled = true
    }
  } catch (e) {
    // Statsig may complain about it being called too early.
  }
  if (isEnabled && BITDRIFT_API_KEY) {
    init(BITDRIFT_API_KEY, SessionStrategy.Activity, {
      url: 'https://api-bsky.bitdrift.io',
      // Only effects iOS, Android instrumentation is set via Gradle Plugin
      enableNetworkInstrumentation: isNetworkEnabled,
    })
  }
})
