import {StyleSheet, View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'

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
  const {_} = useLingui()
  const insets = useSafeAreaInsets()

  return (
    <View
      style={[
        styles.root,
        a.flex_row,
        a.justify_between,
        a.align_center,
        a.px_md,
        {paddingTop: insets.top + 8},
      ]}
      pointerEvents="box-none">
      <ImageMenu onPressShare={onPressShare} onPressSave={onPressSave} />
      <PagerDots count={imageCount} activeIndex={activeIndex} />
      <CircleChromeButton
        icon={CloseIcon}
        label={_(msg`Close image`)}
        onPress={onRequestClose}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
})
