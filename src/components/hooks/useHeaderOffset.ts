import {useWindowDimensions} from 'react-native'

import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'

export function useHeaderOffset() {
  const {isDesktop, isTablet} = useWebMediaQueries()
  const {fontScale} = useWindowDimensions()
  if (isDesktop || isTablet) {
    return 0
  }
  const navBarHeight = 42
  const tabBarPad = 10 + 10 + 3 // padding + border
  const normalLineHeight = 1.2
  const tabBarText = 16 * normalLineHeight * fontScale
  return navBarHeight + tabBarPad + tabBarText
}
