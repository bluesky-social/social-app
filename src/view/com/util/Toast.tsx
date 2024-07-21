import React from 'react'
import {View} from 'react-native'
import Animated, {FadeInUp, FadeOutUp} from 'react-native-reanimated'
import RootSiblings from 'react-native-root-siblings'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {
  FontAwesomeIcon,
  Props as FontAwesomeProps,
} from '@fortawesome/react-native-fontawesome'

import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'
import {IS_TEST} from '#/env'

const TIMEOUT = 4e3

export function show(
  message: string,
  icon: FontAwesomeProps['icon'] = 'check',
) {
  if (IS_TEST) return
  const item = new RootSiblings(<Toast message={message} icon={icon} />)
  setTimeout(() => {
    item.destroy()
  }, TIMEOUT)
}

function Toast({
  message,
  icon,
}: {
  message: string
  icon: FontAwesomeProps['icon']
}) {
  const t = useTheme()
  const {top} = useSafeAreaInsets()

  return (
    <Animated.View
      entering={FadeInUp}
      exiting={FadeOutUp}
      style={[
        a.flex_1,
        a.absolute,
        {top: top + 15, left: 16, right: 16},
        a.align_center,
        // shadow must be here, otherwise it isn't animated and looks janky -sfn
        a.shadow_lg,
        a.rounded_sm,
      ]}
      pointerEvents="none">
      <View
        style={[
          a.flex_1,
          t.atoms.bg,
          t.atoms.border_contrast_medium,
          a.w_full,
          a.rounded_sm,
          a.px_md,
          a.py_lg,
          a.border,
          a.flex_row,
          a.gap_md,
        ]}>
        <View
          style={[
            a.flex_shrink_0,
            a.rounded_full,
            {width: 32, height: 32},
            t.atoms.bg_contrast_25,
            a.align_center,
            a.justify_center,
          ]}>
          <FontAwesomeIcon
            icon={icon}
            size={16}
            style={t.atoms.text_contrast_low}
          />
        </View>
        <View style={[a.h_full, a.justify_center, a.flex_1]}>
          <Text style={[a.text_md]}>{message}</Text>
        </View>
      </View>
    </Animated.View>
  )
}
