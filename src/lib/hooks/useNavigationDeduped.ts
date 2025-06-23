import {useMemo} from 'react'
import {useNavigation} from '@react-navigation/core'

import {useDedupe} from '#/lib/hooks/useDedupe'
import {type NavigationProp} from '#/lib/routes/types'

export type DebouncedNavigationProp = Pick<
  NavigationProp,
  | 'popToTop'
  | 'push'
  | 'navigate'
  | 'canGoBack'
  | 'replace'
  | 'dispatch'
  | 'goBack'
  | 'getState'
  | 'getParent'
>

export function useNavigationDeduped() {
  const navigation = useNavigation<NavigationProp>()
  const dedupe = useDedupe()

  return useMemo<DebouncedNavigationProp>(
    () => ({
      push: (...args: Parameters<typeof navigation.push>) => {
        dedupe(() => navigation.push(...args))
      },
      navigate: (...args: Parameters<typeof navigation.navigate>) => {
        dedupe(() => navigation.navigate(...args))
      },
      replace: (...args: Parameters<typeof navigation.replace>) => {
        dedupe(() => navigation.replace(...args))
      },
      dispatch: (...args: Parameters<typeof navigation.dispatch>) => {
        dedupe(() => navigation.dispatch(...args))
      },
      popToTop: () => {
        dedupe(() => navigation.popToTop())
      },
      goBack: () => {
        dedupe(() => navigation.goBack())
      },
      canGoBack: () => {
        return navigation.canGoBack()
      },
      getState: () => {
        return navigation.getState()
      },
      getParent: (...args: Parameters<typeof navigation.getParent>) => {
        return navigation.getParent(...args)
      },
    }),
    [dedupe, navigation],
  )
}
