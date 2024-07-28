import {useWindowDimensions} from 'react-native'

import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {useShellLayout} from '#/state/shell/shell-layout'

export function useHeaderPosition() {
  const {headerHeight} = useShellLayout()
  const winDim = useWindowDimensions()
  const {isMobile} = useWebMediaQueries()

  let left = 0
  let width = winDim.width
  if (width > 590 && !isMobile) {
    left = winDim.width / 2 - 295
    width = 590
  }

  let offset = isMobile ? 45 : 0

  return {
    top: headerHeight.value - offset,
    left,
    width,
    height: 45,
    borderRadiusObject: undefined,
  }
}
