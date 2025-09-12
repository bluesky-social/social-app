import {useCallback, useImperativeHandle, useState} from 'react'
import {Keyboard} from 'react-native'
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
    </>
  )
}
