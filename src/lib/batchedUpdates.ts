import {unstable_batchedUpdates} from 'react-native'

export function batchedUpdates(fn: () => void): void {
  unstable_batchedUpdates(fn, undefined)
}
