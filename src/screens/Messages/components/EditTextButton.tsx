import {View} from 'react-native'
import {Trans} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import {Button, type ButtonProps} from '#/components/Button'
import {Text} from '#/components/Typography'

export function EditTextButton({
  children,
  style,
  onPress,
  ...props
}: ButtonProps & {value: string}) {
  const t = useTheme()

  return (
    <View style={[a.relative]}>
      <Button
        color="secondary"
        style={[
          a.flex_1,
          a.justify_between,
          a.rounded_full,
          a.border,
          t.atoms.bg,
          t.atoms.border_contrast_low,
          style,
        ]}
        onPress={onPress}
        {...props}>
        {context => (
          <View
            style={[
              a.flex_1,
              a.flex_row,
              a.align_center,
              a.justify_between,
              a.px_md,
              a.py_sm,
            ]}>
            {typeof children === 'function' ? children(context) : children}
            <View
              style={[
                a.ml_sm,
                a.rounded_full,
                t.atoms.bg_contrast_50,
                {paddingHorizontal: 10, paddingVertical: 8},
              ]}>
              <Text
                style={[a.text_xs, a.font_medium, t.atoms.text_contrast_high]}>
                <Trans>Edit</Trans>
              </Text>
            </View>
          </View>
        )}
      </Button>
    </View>
  )
}
