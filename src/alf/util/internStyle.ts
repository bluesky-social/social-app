import {StyleSheet} from 'react-native'

const MAX_INTERNED_STYLES = 1000
const internedStyles = new Map<string, object>()

/**
 * Returns a created (`StyleSheet.create`) style with the same values as
 * `style`, reusing one per distinct set of values. On web that makes a style
 * that's built at render time, e.g. from `t.palette`, render as CSS classes
 * instead of inline, so `hover()` styles can override it.
 *
 * Only use it for styles with few distinct values. Past a cap, e.g. if
 * something animates a value, new styles are returned as-is and render inline.
 */
export function internStyle<T extends object>(style: T): T {
  const key = JSON.stringify(style)
  let interned = internedStyles.get(key)
  if (!interned) {
    if (internedStyles.size >= MAX_INTERNED_STYLES) return style
    interned = StyleSheet.create({style}).style
    internedStyles.set(key, interned)
  }
  return interned as T
}
