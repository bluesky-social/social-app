import {init, SessionStrategy} from '@bitdrift/react-native'
import {Statsig} from 'statsig-react-native-expo'

import {initPromise} from '#/lib/statsig/statsig'
import {logger} from '#/logger'

export {debug, error, info, warn} from '@bitdrift/react-native'

const BITDRIFT_API_KEY = process.env.BITDRIFT_API_KEY

initPromise.then(() => {
  // TODO revert
  let isEnabled = true
  try {
    if (Statsig.checkGate('enable_bitdrift')) {
      isEnabled = true
    }
  } catch (e) {
    // Statsig may complain about it being called too early.
  }
  if (isEnabled && BITDRIFT_API_KEY) {
    logger.info('Bitdrift is enabled')
    init(BITDRIFT_API_KEY, SessionStrategy.Activity, {
      url: 'https://api-bsky.bitdrift.io',
      // TODO gate
      enableNetworkInstrumentation: true, // Only effects iOS, Android instrumentation is set via Gradle Plugin
    })
  } else {
    logger.info('Bitdrift is disabled')
  }
})
