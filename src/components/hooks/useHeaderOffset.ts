import {useWindowDimensions} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'

import {useBreakpoints} from '#/alf'
import {IS_LIQUID_GLASS} from '#/env'

export function useHeaderOffset() {
  const {gtMobile} = useBreakpoints()
  const {fontScale} = useWindowDimensions()
  const insets = useSafeAreaInsets()
  if (gtMobile) {
    return 0
  }
  const navBarHeight = 52 + (IS_LIQUID_GLASS ? insets.top : 0)
  const tabBarPad = 10 + 10 + 3 // padding + border
  const normalLineHeight = 20 // matches tab bar
  const tabBarText = normalLineHeight * fontScale
  return navBarHeight + tabBarPad + tabBarText - 4 // for some reason, this calculation is wrong by 4 pixels, which we adjust
}
