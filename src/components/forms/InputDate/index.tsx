import React from 'react'
import {View} from 'react-native'
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker'

import {useTheme, atoms} from '#/alf'
import {Text} from '#/components/Typography'
import {toSimpleDateString} from '#/components/forms/InputDate/utils'

import {InputDateProps} from '#/components/forms/InputDate/types'
export * as utils from '#/components/forms/InputDate/utils'

/**
 * Date-only input. Accepts a date in the format YYYY-MM-DD, and reports date
 * changes in the same format.
 *
 * For dates of unknown format, convert with the
 * `utils.toSimpleDateString(Date)` export of this file.
 */
export function InputDate({
  value: initialValue,
  onChange,
  testID,
  label,
  accessibilityLabel,
  accessibilityHint,
}: InputDateProps) {
  const labelId = React.useId()
  const t = useTheme()
  const [value, setValue] = React.useState(initialValue)

  const onChangeInternal = React.useCallback(
    (event: DateTimePickerEvent, date: Date | undefined) => {
      if (date) {
        const formatted = toSimpleDateString(date)
        onChange(formatted)
        setValue(formatted)
      }
    },
    [onChange],
  )

  return (
    <View style={[atoms.relative, atoms.w_full]}>
      {label && (
        <Text
          nativeID={labelId}
          style={[
            atoms.text_sm,
            atoms.font_bold,
            t.atoms.text_contrast_600,
            atoms.mb_sm,
          ]}>
          {label}
        </Text>
      )}

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
    </View>
  )
}
