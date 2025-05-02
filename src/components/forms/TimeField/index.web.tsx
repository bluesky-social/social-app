import React from 'react'
import {StyleSheet, type TextInput, type TextInputProps} from 'react-native'
// @ts-expect-error untyped
import {unstable_createElement} from 'react-native-web'

import * as TextField from '#/components/forms/TextField'
import {type TimeFieldProps} from '#/components/forms/TimeField/types'
import {toDateString} from '#/components/forms/TimeField/utils'
import {CalendarDays_Stroke2_Corner0_Rounded as CalendarDays} from '#/components/icons/CalendarDays'

export * as utils from '#/components/forms/TimeField/utils'
export const LabelText = TextField.LabelText

const InputBase = React.forwardRef<HTMLInputElement, TextInputProps>(
  ({style, ...props}, ref) => {
    return unstable_createElement('input', {
      ...props,
      ref,
      type: 'time',
      style: [
        StyleSheet.flatten(style),
        {
          background: 'transparent',
          border: 0,
        },
      ],
    })
  },
)

InputBase.displayName = 'InputBase'

const Input = TextField.createInput(InputBase as unknown as typeof TextInput)

export function TimeField({
  ref,
  value,
  onChangeDate,
  label,
  isInvalid,
  testID,
  accessibilityHint,
  maximumDate,
}: TimeFieldProps) {
  const handleOnChange = React.useCallback(
    (e: any) => {
      const date = e.target.valueAsDate || e.target.value

      if (date) {
        const formatted = toDateString(date)
        onChangeDate(formatted)
      }
    },
    [onChangeDate],
  )

  return (
    <TextField.Root isInvalid={isInvalid}>
      <TextField.Icon icon={CalendarDays} />
      <Input
        value={toDateString(value)}
        inputRef={ref as React.Ref<TextInput>}
        label={label}
        onChange={handleOnChange}
        testID={testID}
        accessibilityHint={accessibilityHint}
        // @ts-expect-error not typed as <input type="date"> even though it is one
        max={maximumDate ? toDateString(maximumDate) : undefined}
      />
    </TextField.Root>
  )
}
