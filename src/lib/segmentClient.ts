import {createClient} from '@segment/analytics-react-native'
// import {createLogger} from '../view/screens/logger'

export const segmentClinet = createClient({
  writeKey: '8I6DsgfiSLuoONyaunGoiQM7A6y2ybdI',
  trackAppLifecycleEvents: true,
  // Uncomment to debug:
  // logger: createLogger(),
})
