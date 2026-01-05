import {init, SessionStrategy} from '@bitdrift/react-native'
import {Statsig} from 'statsig-react-native-expo'

import {initPromise} from '#/lib/statsig/statsig'
import {BITDRIFT_API_KEY} from '#/env'

initPromise.then(() => {
  let isEnabled = false
  let isNetworkEnabled = false
  let isJsErrorsEnabled = false
  try {
    if (Statsig.checkGate('enable_bitdrift_v2')) {
      isEnabled = true
    }
    if (Statsig.checkGate('enable_bitdrift_v2_networking')) {
      isNetworkEnabled = true
    }
    if (Statsig.checkGate('enable_bitdrift_v2_js_errors')) {
      isJsErrorsEnabled = true
    }
  } catch (e) {
    // Statsig may complain about it being called too early.
  }
  if (isEnabled && BITDRIFT_API_KEY) {
    init(BITDRIFT_API_KEY, SessionStrategy.Activity, {
      url: 'https://api-bsky.bitdrift.io',
      // Only effects iOS, Android instrumentation is set via Gradle Plugin
      enableNetworkInstrumentation: isNetworkEnabled,
      crashReporting: {
        enableNativeFatalIssues: true,
        UNSTABLE_enableJsErrors: isJsErrorsEnabled,
      },
    })
  }
})
