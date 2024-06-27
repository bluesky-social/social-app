import {useWindowDimensions} from 'react-native'

import {useShellLayout} from '#/state/shell/shell-layout'

export function useHeaderPosition() {
  const {headerHeight} = useShellLayout()
  const {width} = useWindowDimensions()

  return {
    top: headerHeight.value - 45,
    left: 10,
    width: width - 20,
    height: 45,
    borderRadiusObject: {
      topLeft: 4,
      topRight: 4,
      bottomLeft: 4,
      bottomRight: 4,
    },
  }
}
