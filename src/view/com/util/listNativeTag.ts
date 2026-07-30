import {findNodeHandle} from 'react-native'

import {type ListMethods} from './List'

/**
 * Returns the native view tag backing a List, for handing to native code
 * (e.g. the pager's scrollViewTag). Always null on web.
 */
export function findListNativeTag(list: ListMethods | null): number | null {
  if (!list) return null
  return findNodeHandle(list)
}
