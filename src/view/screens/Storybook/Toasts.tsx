import {Pressable, View} from 'react-native'

import * as Toast from '#/view/com/util/Toast'
import {
  getToastTypeStyles,
  TOAST_TYPE_TO_ICON,
  type ToastType,
} from '#/view/com/util/Toast.style'
import {atoms as a, useTheme} from '#/alf'
import {H1, Text} from '#/components/Typography'

function ToastPreview({message, type}: {message: string; type: ToastType}) {
  const t = useTheme()
  const toastStyles = getToastTypeStyles(t)
  const colors = toastStyles[type as keyof typeof toastStyles]
  const IconComponent =
    TOAST_TYPE_TO_ICON[type as keyof typeof TOAST_TYPE_TO_ICON]

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => Toast.show(message, type)}
      style={[
        {backgroundColor: colors.backgroundColor},
        a.shadow_sm,
        {borderColor: colors.borderColor},
        a.rounded_sm,
        a.border,
        a.px_sm,
        a.py_sm,
        a.flex_row,
        a.gap_sm,
        a.align_center,
      ]}>
      <View
        style={[
          a.flex_shrink_0,
          a.rounded_full,
          {width: 24, height: 24},
          a.align_center,
          a.justify_center,
          {
            backgroundColor: colors.backgroundColor,
          },
        ]}>
        <IconComponent fill={colors.iconColor} size="xs" />
      </View>
      <View style={[a.flex_1]}>
        <Text
          style={[
            a.text_sm,
            a.font_bold,
            a.leading_snug,
            {color: colors.textColor},
          ]}
          emoji>
          {message}
        </Text>
      </View>
    </Pressable>
  )
}

export function Toasts() {
  return (
    <View style={[a.gap_md]}>
      <H1>Toast Examples</H1>

      <View style={[a.gap_md]}>
        <View style={[a.gap_xs]}>
          <ToastPreview message="Default Toast" type="default" />
        </View>

        <View style={[a.gap_xs]}>
          <ToastPreview
            message="Operation completed successfully!"
            type="success"
          />
        </View>

        <View style={[a.gap_xs]}>
          <ToastPreview message="Something went wrong!" type="error" />
        </View>

        <View style={[a.gap_xs]}>
          <ToastPreview message="Please check your input" type="warning" />
        </View>

        <View style={[a.gap_xs]}>
          <ToastPreview message="Here's some helpful information" type="info" />
        </View>

        <View style={[a.gap_xs]}>
          <ToastPreview
            message="This is a longer message to test how the toast handles multiple lines of text content."
            type="info"
          />
        </View>
      </View>
    </View>
  )
}
