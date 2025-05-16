import {useCallback, useImperativeHandle, useState} from 'react'
import {Keyboard} from 'react-native'
import DatePicker from 'react-native-date-picker'
import {useLingui} from '@lingui/react'

import {useTheme} from '#/alf'
import {type DateFieldProps} from '#/components/forms/DateField/types'
import {toSimpleDateString} from '#/components/forms/DateField/utils'
import * as TextField from '#/components/forms/TextField'
import {DateFieldButton} from './index.shared'

export * as utils from '#/components/forms/DateField/utils'
export const LabelText = TextField.LabelText

export function DateField({
  value,
  inputRef,
  onChangeDate,
  label,
  isInvalid,
  testID,
  accessibilityHint,
  maximumDate,
}: DateFieldProps) {
  const {i18n} = useLingui()
  const t = useTheme()
  const [open, setOpen] = useState(false)

  const onChangeInternal = useCallback(
    (date: Date) => {
      setOpen(false)

      const formatted = toSimpleDateString(date)
      onChangeDate(formatted)
    },
    [onChangeDate, setOpen],
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
        onPress={onPress}
        isInvalid={isInvalid}
        accessibilityHint={accessibilityHint}
      />

      {open && (
        // Android implementation of DatePicker currently does not change default button colors according to theme and only takes hex values for buttonColor
        // Can remove the buttonColor setting if/when this PR is merged: https://github.com/henninghall/react-native-date-picker/pull/871
        <DatePicker
          modal
          open
          timeZoneOffsetInMinutes={0}
          theme={t.scheme}
          // @ts-ignore TODO
          buttonColor={t.name === 'light' ? '#000000' : '#ffffff'}
          date={new Date(value)}
          onConfirm={onChangeInternal}
          onCancel={onCancel}
          mode="date"
          locale={i18n.locale}
          is24hourSource="locale"
          testID={`${testID}-datepicker`}
          aria-label={label}
          accessibilityLabel={label}
          accessibilityHint={accessibilityHint}
          maximumDate={
            maximumDate ? new Date(toSimpleDateString(maximumDate)) : undefined
          }
        />
      )}
    </>
  )
}
