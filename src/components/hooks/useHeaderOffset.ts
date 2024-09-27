import {useWindowDimensions} from 'react-native'

import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'

export function useHeaderOffset() {
  const {isDesktop, isTablet} = useWebMediaQueries()
  const {fontScale} = useWindowDimensions()
  if (isDesktop || isTablet) {
    return 0
  }
  const navBarHeight = 42
  const tabBarPad = 10 + 10 + 6 // padding + arbitrary
  const normalLineHeight = 20 // matches tab bar
  const tabBarText = normalLineHeight * fontScale
  return navBarHeight + tabBarPad + tabBarText
}
