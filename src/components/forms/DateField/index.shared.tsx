import React from 'react'
import {View, Pressable} from 'react-native'

import {atoms as a, android, useTheme, web} from '#/alf'
import {Text} from '#/components/Typography'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import * as TextField from '#/components/forms/TextField'
import {CalendarDays_Stroke2_Corner0_Rounded as CalendarDays} from '#/components/icons/CalendarDays'
import {localizeDate} from './utils'

// looks like a TextField.Input, but is just a button. It'll do something different on each platform on press
// iOS: open a dialog with an inline date picker
// Android: open the date picker modal

export function DateFieldButton({
  label,
  value,
  onPress,
  isInvalid,
  accessibilityHint,
}: {
  label: string
  value: string
  onPress: () => void
  isInvalid?: boolean
  accessibilityHint?: string
}) {
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
    TextField.useSharedInputStyles()

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
            paddingTop: 12,
            paddingBottom: 12,
            paddingLeft: 14,
            paddingRight: 14,
            borderColor: 'transparent',
            borderWidth: 2,
          },
          android({
            minHeight: 57.5,
          }),
          a.flex_row,
          a.flex_1,
          a.w_full,
          a.rounded_sm,
          t.atoms.bg_contrast_25,
          a.align_center,
          hovered ? chromeHover : {},
          focused || pressed ? chromeFocus : {},
          isInvalid || isInvalid ? chromeError : {},
          (isInvalid || isInvalid) && (hovered || focused)
            ? chromeErrorHover
            : {},
        ]}>
        <TextField.Icon icon={CalendarDays} />
        <Text
          style={[
            a.text_md,
            a.pl_xs,
            t.atoms.text,
            {lineHeight: a.text_md.fontSize * 1.1875},
          ]}>
          {localizeDate(value)}
        </Text>
      </Pressable>
    </View>
  )
}
