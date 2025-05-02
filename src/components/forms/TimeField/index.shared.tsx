import {Pressable, View} from 'react-native'
import {useLingui} from '@lingui/react'

import {atoms as a, useTheme, web} from '#/alf'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {Text} from '#/components/Typography'
import {useSharedInputStyles} from '../TextField'
import {displayDuration} from './utils'

// looks like a TextField.Input, but is just a button. It'll do something different on each platform on press
// iOS: open a dialog with an inline date picker
// Android: open the date picker modal

export function TimeFieldButton({
  label,
  value,
  onPress,
  isInvalid,
  accessibilityHint,
}: {
  label: string
  value: string | Date
  onPress: () => void
  isInvalid?: boolean
  accessibilityHint?: string
}) {
  const {i18n} = useLingui()
  const t = useTheme()

  const {
    state: pressed,
    onIn: onPressIn,
    onOut: onPressOut,
  } = useInteractionState()
  const {
    state: hovered,
    onIn: onHoverIn,
    onOut: onHoverOut,
  } = useInteractionState()
  const {state: focused, onIn: onFocus, onOut: onBlur} = useInteractionState()

  const {chromeHover, chromeFocus, chromeError, chromeErrorHover} =
    useSharedInputStyles()

  const minutesFromNow = (new Date(value).getTime() - Date.now()) / (1000 * 60)

  return (
    <View
      style={[a.relative, a.w_full]}
      {...web({
        onMouseOver: onHoverIn,
        onMouseOut: onHoverOut,
      })}>
      <Pressable
        aria-label={label}
        accessibilityLabel={label}
        accessibilityHint={accessibilityHint}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onFocus={onFocus}
        onBlur={onBlur}
        style={[
          {
            borderColor: 'transparent',
            borderWidth: 2,
          },
          a.px_sm,
          a.py_sm,
          a.flex_1,
          a.w_full,
          a.rounded_sm,
          t.atoms.bg_contrast_25,
          a.align_start,
          hovered ? chromeHover : {},
          focused || pressed ? chromeFocus : {},
          isInvalid || isInvalid ? chromeError : {},
          (isInvalid || isInvalid) && (hovered || focused)
            ? chromeErrorHover
            : {},
        ]}>
        <Text
          style={[
            a.text_md,
            t.atoms.text,
            a.font_bold,
            {lineHeight: a.text_md.fontSize * 1.1875},
          ]}>
          {i18n
            .date(value, {hour: 'numeric', minute: '2-digit', hour12: true})
            .toLocaleUpperCase()
            .replace(' ', '')}
        </Text>
        <Text
          style={[
            a.text_sm,
            t.atoms.text_contrast_medium,
            {lineHeight: a.text_md.fontSize * 1.1875},
          ]}>
          {displayDuration(i18n, minutesFromNow)}
        </Text>
      </Pressable>
    </View>
  )
}
