import {type ListMethods} from './List'

/**
 * Returns the native view tag backing a List, for handing to native code
 * (e.g. the pager's scrollViewTag). Always null on web.
 */
export function findListNativeTag(_list: ListMethods | null): number | null {
  return null
}
