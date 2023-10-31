import {DependencyList, useMemo} from 'react'
import {ViewStyle, TextStyle, ImageStyle, StyleProp} from 'react-native'

/**
 * Use this hook to memoize a style.
 *
 * Usage:
 * - const s1 = useStyle( () => ({ height: someValue }), [someValue] )
 * - const s2 = useStyle( () => [propStyle, { height: someValue }], [propStyle, someValue] )
 */
export const useStyle = <StyleType extends ViewStyle | TextStyle | ImageStyle>(
  styleFunction: () => StyleProp<StyleType>,
  dependencies?: DependencyList,
): StyleProp<StyleType> => {
  // No need to warn that we're not listing styleFunction a depenency.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(styleFunction, dependencies)
}
