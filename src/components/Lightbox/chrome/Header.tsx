import {View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {useLingui} from '@lingui/react/macro'

import {atoms as a} from '#/alf'
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
        a.px_md,
        a.pointer_events_box_none,
        {paddingTop: insets.top + 8},
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
