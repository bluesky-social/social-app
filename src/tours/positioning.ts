import {useWindowDimensions} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'

import {useShellLayout} from '#/state/shell/shell-layout'

export function useHeaderPosition() {
  const {headerHeight} = useShellLayout()
  const {width} = useWindowDimensions()
  const insets = useSafeAreaInsets()

  return {
    top: insets.top,
    left: 10,
    width: width - 20,
    height: headerHeight.value,
    borderRadiusObject: {
      topLeft: 4,
      topRight: 4,
      bottomLeft: 4,
      bottomRight: 4,
    },
  }
}
