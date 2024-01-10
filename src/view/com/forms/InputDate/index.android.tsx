import React from 'react'
import {View, TextStyle, Pressable} from 'react-native'
import DateTimePicker, {
  BaseProps as DateTimePickerProps,
} from '@react-native-community/datetimepicker'

import {Logo} from '#/view/icons/Logo'
import {useTheme, atoms, tokens} from '#/alf'
import {Text} from '#/view/com/Typography'
import {useInteractionState} from '#/view/com/util/hooks/useInteractionState'

import {InputDateProps} from '#/view/com/forms/InputDate/types'
import {
  localizeDate,
  toSimpleDateString,
} from '#/view/com/forms/InputDate/utils'

export * as utils from '#/view/com/forms/InputDate/utils'

export function InputDate({
  value: initialValue,
  onChange,
  testID,
  label,
  hasError,
  accessibilityLabel,
  accessibilityHint,
  ...props
}: InputDateProps) {
  const labelId = React.useId()
  const t = useTheme()
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState(initialValue)
  const {state: focused, onIn: onFocus, onOut: onBlur} = useInteractionState()

  const {inputStyles, iconStyles} = React.useMemo(() => {
    const input: TextStyle[] = [
      {
        paddingLeft: 40,
      },
    ]
    const icon: TextStyle[] = []

    if (hasError) {
      input.push({
        borderColor: tokens.color.red_200,
      })
      icon.push({
        color: tokens.color.red_400,
      })
    }

    if (focused) {
      input.push({
        borderColor: t.atoms.border_contrast_500.borderColor,
      })

      if (hasError) {
        input.push({
          borderColor: tokens.color.red_500,
        })
      }
    }

    return {inputStyles: input, iconStyles: icon}
  }, [t, focused, hasError])

  const onChangeInternal = React.useCallback<
    Required<DateTimePickerProps>['onChange']
  >(
    (_event, date) => {
      setOpen(false)

      if (date) {
        const formatted = toSimpleDateString(date)
        onChange(formatted)
        setValue(formatted)
      }
    },
    [onChange, setOpen, setValue],
  )

  return (
    <View style={[atoms.relative, atoms.w_full]}>
      {label && (
        <Text
          nativeID={labelId}
          style={[
            atoms.text_sm,
            atoms.font_semibold,
            t.atoms.text_contrast_700,
            atoms.mb_sm,
          ]}>
          {label}
        </Text>
      )}

      <Pressable
        {...props}
        aria-labelledby={labelId}
        aria-label={label}
        accessibilityLabelledBy={labelId}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        onPress={() => setOpen(true)}
        onFocus={onFocus}
        onBlur={onBlur}
        style={[
          {
            paddingTop: atoms.pt_md.paddingTop + 2,
          },
          atoms.w_full,
          atoms.px_lg,
          atoms.pb_md,
          atoms.rounded_sm,
          t.atoms.bg_contrast_100,
          ...inputStyles,
        ]}>
        <Text style={[atoms.text_md, t.atoms.text]}>{localizeDate(value)}</Text>
      </Pressable>

      <View
        style={[
          atoms.absolute,
          atoms.inset_0,
          atoms.align_center,
          atoms.justify_center,
          atoms.pl_md,
          {right: 'auto'},
        ]}>
        <Logo
          style={[
            {color: t.atoms.border_contrast_500.borderColor},
            {
              width: 20,
              pointerEvents: 'none',
            },
            ...iconStyles,
          ]}
        />
      </View>

      {open && (
        <DateTimePicker
          testID={`${testID}-datepicker`}
          mode="date"
          timeZoneName={'Etc/UTC'}
          display="spinner"
          // @ts-ignore applies in iOS only -prf
          themeVariant={t.name === 'dark' ? 'dark' : 'light'}
          value={new Date(value)}
          onChange={onChangeInternal}
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={accessibilityHint}
          aria-labelledby={labelId}
          aria-label={label}
        />
      )}
    </View>
  )
}
