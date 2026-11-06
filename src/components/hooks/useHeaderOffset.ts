import {useWindowDimensions} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'

import {useDuoCompactHeader} from '#/view/shell/duoFoldedNavigation'
import {useBreakpoints} from '#/alf'
import {IS_NATIVE, IS_WEB} from '#/env'

export function useHeaderOffset() {
  const compactHeader = useDuoCompactHeader()
  const {gtMobile} = useBreakpoints()
  const {fontScale} = useWindowDimensions()
  const insets = useSafeAreaInsets()
  if (gtMobile && IS_WEB) {
    return 0
  }
  const navBarHeight = compactHeader
    ? compactHeader.topPadding + compactHeader.headerHeight
    : 52 + (IS_NATIVE ? insets.top : 0) - 4
  const tabBarPad = 10 + 10 + 3 // padding + border
  const normalLineHeight = 20 // matches tab bar
  const tabBarText = normalLineHeight * fontScale
  return navBarHeight + tabBarPad + tabBarText
}
