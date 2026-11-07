import {View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {useLingui} from '@lingui/react/macro'

import {atoms as a, tokens, useBreakpoints} from '#/alf'
import {TimesLarge_Stroke2_Corner0_Rounded as CloseIcon} from '#/components/icons/Times'
import {CircleChromeButton} from './CircleChromeButton'
import {ImageMenu} from './ImageMenu'
import {PagerDots} from './PagerDots'

type Props = {
  onRequestClose: () => void
  onPressShare: () => void
  onPressSave: () => void
  imageCount: number
  activeIndex: number
}

export function Header({
  onRequestClose,
  onPressShare,
  onPressSave,
  imageCount,
  activeIndex,
}: Props) {
  const {t: l} = useLingui()
  const insets = useSafeAreaInsets()
  const {gtMobile} = useBreakpoints()
  /*
   * On tablet layouts, pad both sides equally so the pager dots stay centred
   * on the screen. On phones, keep the buttons as close to the edges as the
   * safe area allows (e.g. clear of the iPhone Duo's vertical bar).
   */
  const sideInset = Math.max(insets.left, insets.right)
  const paddingLeft = (gtMobile ? sideInset : insets.left) + tokens.space.md
  const paddingRight = (gtMobile ? sideInset : insets.right) + tokens.space.md

  return (
    <View
      style={[
        a.absolute,
        a.top_0,
        a.left_0,
        a.right_0,
        a.flex_row,
        a.justify_between,
        a.align_center,
        a.pointer_events_box_none,
        {
          paddingTop: insets.top + 8,
          paddingLeft,
          paddingRight,
        },
      ]}>
      <ImageMenu onPressShare={onPressShare} onPressSave={onPressSave} />
      <PagerDots count={imageCount} activeIndex={activeIndex} />
      <CircleChromeButton
        icon={CloseIcon}
        label={l`Close image`}
        onPress={onRequestClose}
      />
    </View>
  )
}
