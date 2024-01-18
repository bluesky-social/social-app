import React from 'react'
import {TextInput, TextInputProps, StyleSheet} from 'react-native'
// @ts-ignore
import {unstable_createElement} from 'react-native-web'

import TextField, {createInput} from '#/components/forms/TextField'

import {toSimpleDateString} from '#/components/forms/InputDate/utils'

export * as utils from '#/components/forms/InputDate/utils'
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

const Input = createInput(InputBase as unknown as typeof TextInput)

export function DateField({
  value,
  onChange,
  label,
  isInvalid,
  testID,
}: {
  value: string
  onChange: (value: string) => void
  label: string
  isInvalid?: boolean
  testID?: string
}) {
  const handleOnChange = React.useCallback(
    (e: any) => {
      const date = e.target.valueAsDate || e.target.value

      if (date) {
        const formatted = toSimpleDateString(date)
        onChange(formatted)
      }
    },
    [onChange],
  )

  return (
    <TextField.Root>
      <Input
        value={value}
        label={label}
        onChange={handleOnChange}
        onChangeText={() => {}}
        isInvalid={isInvalid}
        testID={testID}
      />
    </TextField.Root>
  )
}
