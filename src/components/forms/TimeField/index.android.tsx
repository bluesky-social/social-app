import {useCallback, useImperativeHandle, useState} from 'react'
import {Keyboard} from 'react-native'
import DatePicker from 'react-native-date-picker'

import {useTheme} from '#/alf'
import * as TextField from '#/components/forms/TextField'
import {type TimeFieldProps} from '#/components/forms/TimeField/types'
import {toDateString} from '#/components/forms/TimeField/utils'
import {TimeFieldButton} from './index.shared'
export * as utils from '#/components/forms/TimeField/utils'

export const LabelText = TextField.LabelText

export function TimeField({
  ref,
  value,
  onChangeDate,
  label,
  isInvalid,
  testID,
  accessibilityHint,
  minimumDate,
  maximumDate,
}: TimeFieldProps) {
  const t = useTheme()
  const [open, setOpen] = useState(false)

  const onChangeInternal = useCallback(
    (date: Date) => {
      setOpen(false)

      const formatted = toDateString(date)
      onChangeDate(formatted)
    },
    [onChangeDate, setOpen],
  )

  useImperativeHandle(
    ref,
    () => ({
      focus: () => {
        Keyboard.dismiss()
        setOpen(true)
      },
      blur: () => {
        setOpen(false)
      },
    }),
    [],
  )

  const onPress = useCallback(() => {
    setOpen(true)
  }, [])

  const onCancel = useCallback(() => {
    setOpen(false)
  }, [])

  return (
    <>
      <TimeFieldButton
        label={label}
        value={value}
        onPress={onPress}
        isInvalid={isInvalid}
        accessibilityHint={accessibilityHint}
      />

      <DatePicker
        modal
        open={open}
        timeZoneOffsetInMinutes={0}
        theme={t.scheme}
        // @ts-ignore TODO
        buttonColor={t.name === 'light' ? '#000000' : '#ffffff'}
        date={new Date(value)}
        onConfirm={onChangeInternal}
        onCancel={onCancel}
        mode="time"
        testID={`${testID}-timepicker`}
        aria-label={label}
        accessibilityLabel={label}
        accessibilityHint={accessibilityHint}
        minimumDate={
          minimumDate ? new Date(toDateString(minimumDate)) : undefined
        }
        maximumDate={
          maximumDate ? new Date(toDateString(maximumDate)) : undefined
        }
      />
    </>
  )
}
