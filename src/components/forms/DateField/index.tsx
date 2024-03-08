import React from 'react'
import {View} from 'react-native'

import {useTheme, atoms} from '#/alf'
import * as TextField from '#/components/forms/TextField'
import {toSimpleDateString} from '#/components/forms/DateField/utils'
import {DateFieldProps} from '#/components/forms/DateField/types'
import DatePicker from 'react-native-date-picker'

export * as utils from '#/components/forms/DateField/utils'
export const Label = TextField.Label

/**
 * Date-only input. Accepts a date in the format YYYY-MM-DD, and reports date
 * changes in the same format.
 *
 * For dates of unknown format, convert with the
 * `utils.toSimpleDateString(Date)` export of this file.
 */
export function DateField({
  value,
  onChangeDate,
  testID,
  label,
}: DateFieldProps) {
  const t = useTheme()

  const onChangeInternal = React.useCallback(
    (date: Date | undefined) => {
      if (date) {
        const formatted = toSimpleDateString(date)
        onChangeDate(formatted)
      }
    },
    [onChangeDate],
  )

  return (
    <View style={[atoms.relative, atoms.w_full]}>
      <DatePicker
        theme={t.name === 'light' ? 'light' : 'dark'}
        date={new Date(value)}
        onDateChange={onChangeInternal}
        mode="date"
        testID={`${testID}-datepicker`}
        aria-label={label}
        accessibilityLabel={label}
        accessibilityHint={undefined}
      />
    </View>
  )
}
