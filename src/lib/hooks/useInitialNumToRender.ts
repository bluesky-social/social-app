import {useWindowDimensions} from 'react-native'
import {useBottomTabBarHeight} from '@react-navigation/bottom-tabs'

const MIN_POST_HEIGHT = 100

export function useInitialNumToRender({
  minItemHeight = MIN_POST_HEIGHT,
  screenHeightOffset = 0,
}: {minItemHeight?: number; screenHeightOffset?: number} = {}) {
  const {height: screenHeight} = useWindowDimensions()
  const bottomBarHeight = useBottomTabBarHeight()
  const finalHeight = screenHeight - screenHeightOffset - bottomBarHeight
  return Math.floor(finalHeight / minItemHeight) + 1
}
