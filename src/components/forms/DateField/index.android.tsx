import {useCallback, useImperativeHandle, useState} from 'react'
import {Keyboard} from 'react-native'
import {DatePickerDialog, Host} from '@expo/ui/jetpack-compose'

import {useTheme} from '#/alf'
import {type DateFieldProps} from '#/components/forms/DateField/types'
import {
  toLocalMidnight,
  toSimpleDateString,
} from '#/components/forms/DateField/utils'
import * as TextField from '#/components/forms/TextField'
import {DateFieldButton} from './index.shared'

export * as utils from '#/components/forms/DateField/utils'
export const LabelText = TextField.LabelText

export function DateField({
  value,
  inputRef,
  onChangeDate,
  onConfirm,
  placeholder,
  label,
  isInvalid,
  accessibilityHint,
  maximumDate,
  minimumDate,
}: DateFieldProps) {
  const t = useTheme()
  const [open, setOpen] = useState(false)

  /*
   * The picker requires a valid date, so when value is empty we open at
   * maximumDate (if set) or today. Normalize through toSimpleDateString so a
   * date-only value is parsed as UTC midnight, which is what the Material 3
   * picker expects for its selected date (it works in UTC day millis).
   */
  const initialDate =
    value === ''
      ? maximumDate
        ? new Date(toSimpleDateString(maximumDate))
        : new Date()
      : new Date(toSimpleDateString(value))

  /*
   * Unlike the selection, the selectable range is resolved by the native side
   * in the device time zone, so pass local midnight to keep the intended
   * calendar day for devices west of UTC.
   */
  const selectableDates =
    minimumDate || maximumDate
      ? {
          start: minimumDate ? toLocalMidnight(minimumDate) : undefined,
          end: maximumDate ? toLocalMidnight(maximumDate) : undefined,
        }
      : undefined

  const onChangeInternal = useCallback(
    (date: Date) => {
      setOpen(false)

      const formatted = toSimpleDateString(date)
      onChangeDate(formatted)
      onConfirm?.(formatted)
    },
    [onChangeDate, onConfirm, setOpen],
  )

  useImperativeHandle(
    inputRef,
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
      <DateFieldButton
        label={label}
        value={value}
        placeholder={placeholder}
        onPress={onPress}
        isInvalid={isInvalid}
        accessibilityHint={accessibilityHint}
      />
      {open && (
        <Host colorScheme={t.scheme}>
          <DatePickerDialog
            initialDate={initialDate.toISOString()}
            selectableDates={selectableDates}
            showVariantToggle={false}
            onDateSelected={onChangeInternal}
            onDismissRequest={onCancel}
          />
        </Host>
      )}
    </>
  )
}
