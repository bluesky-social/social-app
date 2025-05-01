import {View} from 'react-native'
import {Trans} from '@lingui/macro'

import {atoms as a, tokens, useTheme} from '#/alf'
import {Text} from '#/components/Typography'

export function LiveIndicator({size = 'small'}: {size?: 'small' | 'large'}) {
  const t = useTheme()

  const fontSize = {
    small: a.text_2xs,
    large: a.text_xs,
  }[size]

  return (
    <View
      style={[
        a.absolute,
        a.w_full,
        a.align_center,
        a.pointer_events_none,
        {bottom: size === 'small' ? -5 : -8},
      ]}>
      <View
        style={{
          backgroundColor: t.palette.negative_500,
          paddingVertical: size === 'small' ? 1 : 2,
          paddingHorizontal: size === 'small' ? 3 : 4,
          borderRadius: size === 'small' ? tokens.borderRadius.xs : 5,
        }}>
        <Text
          style={[
            a.text_center,
            a.font_bold,
            fontSize,
            {color: t.palette.white},
          ]}>
          <Trans comment="Live status indicator on avatar. Should be extremely short, not much space for more than 4 characters">
            LIVE
          </Trans>
        </Text>
      </View>
    </View>
  )
}
