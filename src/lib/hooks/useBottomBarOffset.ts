import {useSafeAreaInsets} from 'react-native-safe-area-context'

import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {clamp} from '#/lib/numbers'
import {isWeb} from '#/platform/detection'

export function useBottomBarOffset(modifier: number = 0) {
  const {isTabletOrDesktop} = useWebMediaQueries()
  const {bottom: bottomInset} = useSafeAreaInsets()
  return (
    (isWeb && isTabletOrDesktop ? 0 : clamp(60 + bottomInset, 60, 75)) +
    modifier
  )
}
