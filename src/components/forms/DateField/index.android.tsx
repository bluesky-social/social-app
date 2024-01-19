import React from 'react'
import {View, Pressable} from 'react-native'
import DateTimePicker, {
  BaseProps as DateTimePickerProps,
} from '@react-native-community/datetimepicker'

import {useTheme, atoms} from '#/alf'
import {Text} from '#/components/Typography'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import * as TextField from '#/components/forms/TextField'
import {CalendarDays_Stroke2_Corner0_Rounded as CalendarDays} from '#/components/icons/CalendarDays'

import {DateFieldProps} from '#/components/forms/DateField/types'
import {
  localizeDate,
  toSimpleDateString,
} from '#/components/forms/DateField/utils'

export * as utils from '#/components/forms/DateField/utils'
export const Label = TextField.Label

export function DateField({
  value,
  onChangeDate,
  label,
  isInvalid,
  testID,
}: DateFieldProps) {
  const t = useTheme()
  const [open, setOpen] = React.useState(false)
  const {
    state: pressed,
    onIn: onPressIn,
    onOut: onPressOut,
  } = useInteractionState()
  const {state: focused, onIn: onFocus, onOut: onBlur} = useInteractionState()

  const {chromeFocus, chromeError, chromeErrorHover} =
    TextField.useSharedInputStyles()

  const onChangeInternal = React.useCallback<
    Required<DateTimePickerProps>['onChange']
  >(
    (_event, date) => {
      setOpen(false)

      if (date) {
        const formatted = toSimpleDateString(date)
        onChangeDate(formatted)
      }
    },
    [onChangeDate, setOpen],
  )

  return (
    <View style={[atoms.relative, atoms.w_full]}>
      <Pressable
        aria-label={label}
        accessibilityLabel={label}
        accessibilityHint={undefined}
        onPress={() => setOpen(true)}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onFocus={onFocus}
        onBlur={onBlur}
        style={[
          {
            paddingTop: 16,
            paddingBottom: 16,
            borderColor: 'transparent',
            borderWidth: 2,
          },
          atoms.flex_row,
          atoms.flex_1,
          atoms.w_full,
          atoms.px_lg,
          atoms.rounded_sm,
          t.atoms.bg_contrast_50,
          focused || pressed ? chromeFocus : {},
          isInvalid ? chromeError : {},
          isInvalid && (focused || pressed) ? chromeErrorHover : {},
        ]}>
        <TextField.Icon icon={CalendarDays} />

        <Text
          style={[atoms.text_md, atoms.pl_xs, t.atoms.text, {paddingTop: 3}]}>
          {localizeDate(value)}
        </Text>
      </Pressable>

      {open && (
        <DateTimePicker
          aria-label={label}
          accessibilityLabel={label}
          accessibilityHint={undefined}
          testID={`${testID}-datepicker`}
          mode="date"
          timeZoneName={'Etc/UTC'}
          display="spinner"
          // @ts-ignore applies in iOS only -prf
          themeVariant={t.name === 'dark' ? 'dark' : 'light'}
          value={new Date(value)}
          onChange={onChangeInternal}
        />
      )}
    </View>
  )
}
