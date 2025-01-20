import {useWindowDimensions} from 'react-native'

import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'

export function useHeaderOffset() {
  const {isDesktop, isTablet} = useWebMediaQueries()
  const {fontScale} = useWindowDimensions()
  if (isDesktop || isTablet) {
    return 0
  }
  const navBarHeight = 52
  const tabBarPad = 10 + 10 + 3 // padding + border
  const normalLineHeight = 20 // matches tab bar
  const tabBarText = normalLineHeight * fontScale
  return navBarHeight + tabBarPad + tabBarText - 4 // for some reason, this calculation is wrong by 4 pixels, which we adjust
}
