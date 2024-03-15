import React from 'react'
import {View} from 'react-native'

import {useTheme, atoms as a} from '#/alf'
import * as TextField from '#/components/forms/TextField'
import {toSimpleDateString} from '#/components/forms/DateField/utils'
import {DateFieldProps} from '#/components/forms/DateField/types'
import DatePicker from 'react-native-date-picker'
import * as Dialog from '#/components/Dialog'
import {DateFieldButton} from './index.shared'
import {Button, ButtonText} from '#/components/Button'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

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
  isInvalid,
  accessibilityHint,
}: DateFieldProps) {
  const {_} = useLingui()
  const t = useTheme()
  const control = Dialog.useDialogControl()

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
    <>
      <DateFieldButton
        label={label}
        value={value}
        onPress={control.open}
        isInvalid={isInvalid}
        accessibilityHint={accessibilityHint}
      />
      <Dialog.Outer control={control} testID={testID}>
        <Dialog.Handle />
        <Dialog.Inner label={label}>
          <View style={a.gap_lg}>
            <View style={[a.relative, a.w_full, a.align_center]}>
              <DatePicker
                theme={t.name === 'light' ? 'light' : 'dark'}
                date={new Date(value)}
                onDateChange={onChangeInternal}
                mode="date"
                testID={`${testID}-datepicker`}
                aria-label={label}
                accessibilityLabel={label}
                accessibilityHint={accessibilityHint}
              />
            </View>
            <Button
              label={_(msg`Done`)}
              onPress={() => control.close()}
              size="medium"
              color="primary"
              variant="solid">
              <ButtonText>
                <Trans>Done</Trans>
              </ButtonText>
            </Button>
          </View>
        </Dialog.Inner>
      </Dialog.Outer>
    </>
  )
}
