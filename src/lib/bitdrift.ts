import {init} from '@bitdrift/react-native'

const BITDRIFT_API_KEY = process.env.BITDRIFT_API_KEY

if (BITDRIFT_API_KEY) {
  init(BITDRIFT_API_KEY, {url: 'https://api-bsky.bitdrift.io'})
}
