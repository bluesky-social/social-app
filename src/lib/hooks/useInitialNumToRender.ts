import {useWindowDimensions} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'

import {useBottomBarOffset} from 'lib/hooks/useBottomBarOffset'

const MIN_POST_HEIGHT = 100

export function useInitialNumToRender({
  minItemHeight = MIN_POST_HEIGHT,
  screenHeightOffset = 0,
}: {minItemHeight?: number; screenHeightOffset?: number} = {}) {
  const {height: screenHeight} = useWindowDimensions()
  const {top: topInset} = useSafeAreaInsets()
  const bottomBarHeight = useBottomBarOffset()

  const finalHeight =
    screenHeight - screenHeightOffset - topInset - bottomBarHeight
  return Math.floor(finalHeight / minItemHeight) + 1
}
