import React from 'react'
import {TextInput, TextInputProps, StyleSheet} from 'react-native'
// @ts-ignore
import {unstable_createElement} from 'react-native-web'

import * as TextField from '#/components/forms/TextField'
import {toSimpleDateString} from '#/components/forms/DateField/utils'
import {DateFieldProps} from '#/components/forms/DateField/types'

export * as utils from '#/components/forms/DateField/utils'
export const Label = TextField.Label

const InputBase = React.forwardRef<HTMLInputElement, TextInputProps>(
  ({style, ...props}, ref) => {
    return unstable_createElement('input', {
      ...props,
      ref,
      type: 'date',
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

export function DateField({
  value,
  onChangeDate,
  label,
  isInvalid,
  testID,
}: DateFieldProps) {
  const handleOnChange = React.useCallback(
    (e: any) => {
      const date = e.target.valueAsDate || e.target.value

      if (date) {
        const formatted = toSimpleDateString(date)
        onChangeDate(formatted)
      }
    },
    [onChangeDate],
  )

  return (
    <TextField.Root isInvalid={isInvalid}>
      <Input
        value={value}
        label={label}
        onChange={handleOnChange}
        onChangeText={() => {}}
        testID={testID}
      />
    </TextField.Root>
  )
}
