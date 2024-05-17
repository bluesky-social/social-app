import React from 'react'
import {View} from 'react-native'
import Animated from 'react-native-reanimated'
import {Trans} from '@lingui/macro'

import {
  ScaleAndFadeIn,
  ScaleAndFadeOut,
} from 'lib/custom-animations/ScaleAndFade'
import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'

export function NewMessagesPill() {
  const t = useTheme()

  React.useEffect(() => {}, [])

  return (
    <Animated.View
      style={[
        a.py_sm,
        a.rounded_full,
        a.shadow_sm,
        a.border,
        t.atoms.bg_contrast_50,
        t.atoms.border_contrast_medium,
        {
          position: 'absolute',
          bottom: 70,
          width: '40%',
          left: '30%',
          alignItems: 'center',
          shadowOpacity: 0.125,
          shadowRadius: 12,
          shadowOffset: {width: 0, height: 5},
        },
      ]}
      entering={ScaleAndFadeIn}
      exiting={ScaleAndFadeOut}>
      <View style={{flex: 1}}>
        <Text style={[a.font_bold]}>
          <Trans>New messages</Trans>
        </Text>
      </View>
    </Animated.View>
  )
}
