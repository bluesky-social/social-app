import {View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {EyeSlash_Stroke2_Corner0_Rounded as EyeSlash} from '#/components/icons/EyeSlash'
import {Text} from '#/components/Typography'

export function PostThreadShowHiddenReplies({
  type,
  onPress,
  hideTopBorder,
}: {
  type: 'hidden' | 'muted'
  onPress: () => void
  hideTopBorder?: boolean
}) {
  const {_} = useLingui()
  const t = useTheme()
  const label =
    type === 'muted' ? _(msg`Show muted replies`) : _(msg`Show hidden replies`)

  return (
    <Button onPress={onPress} label={label}>
      {({hovered, pressed}) => (
        <View
          style={[
            a.flex_1,
            a.flex_row,
            a.align_center,
            a.gap_sm,
            a.py_lg,
            a.px_xl,
            !hideTopBorder && a.border_t,
            t.atoms.border_contrast_low,
            hovered || pressed ? t.atoms.bg_contrast_25 : t.atoms.bg,
          ]}>
          <View
            style={[
              t.atoms.bg_contrast_25,
              a.align_center,
              a.justify_center,
              {
                width: 26,
                height: 26,
                borderRadius: 13,
                marginRight: 4,
              },
            ]}>
            <EyeSlash size="sm" fill={t.atoms.text_contrast_medium.color} />
          </View>
          <Text
            style={[t.atoms.text_contrast_medium, a.flex_1, a.leading_snug]}
            numberOfLines={1}>
            {label}
          </Text>
        </View>
      )}
    </Button>
  )
}
