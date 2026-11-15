import {useSafeAreaInsets} from 'react-native-safe-area-context'

import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {clamp} from '#/lib/numbers'
import {useSession} from '#/state/session'
import {IS_WEB} from '#/env'

export function useBottomBarOffset(modifier: number = 0) {
  const {isTabletOrDesktop} = useWebMediaQueries()
  const {bottom: bottomInset} = useSafeAreaInsets()
  const {hasSession} = useSession()
  const hasNoBottomBar = isTabletOrDesktop && (IS_WEB || hasSession)
  return (hasNoBottomBar ? 0 : clamp(60 + bottomInset, 60, 75)) + modifier
}
