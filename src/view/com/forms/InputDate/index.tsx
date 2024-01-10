import React from 'react'
import {View, TextInputProps} from 'react-native'
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker'

import {useTheme, atoms} from '#/alf'
import {Text} from '#/view/com/Typography'
import {BaseProps} from '#/view/com/forms/types'
import {toSimpleDateString} from '#/view/com/forms/InputDate/utils'

type Props = Omit<TextInputProps, 'placeholder' | 'value'> & BaseProps

export * as utils from '#/view/com/forms/InputDate/utils'

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
}: Props) {
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
            atoms.font_semibold,
            t.atoms.text_contrast_700,
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
