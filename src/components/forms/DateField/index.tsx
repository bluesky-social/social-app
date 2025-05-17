import {useCallback, useImperativeHandle} from 'react'
import {Keyboard, View} from 'react-native'
import DatePicker from 'react-native-date-picker'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {type DateFieldProps} from '#/components/forms/DateField/types'
import {toSimpleDateString} from '#/components/forms/DateField/utils'
import * as TextField from '#/components/forms/TextField'
import {DateFieldButton} from './index.shared'

export * as utils from '#/components/forms/DateField/utils'
export const LabelText = TextField.LabelText

/**
 * Date-only input. Accepts a string in the format YYYY-MM-DD, or a Date object.
 * Date objects are converted to strings in the format YYYY-MM-DD.
 * Returns a string in the format YYYY-MM-DD.
 *
 * To generate a string in the format YYYY-MM-DD from a Date object, use the
 * `utils.toSimpleDateString(Date)` export of this file.
 */
export function DateField({
  value,
  inputRef,
  onChangeDate,
  testID,
  label,
  isInvalid,
  accessibilityHint,
  maximumDate,
}: DateFieldProps) {
  const {_, i18n} = useLingui()
  const t = useTheme()
  const control = Dialog.useDialogControl()

  const onChangeInternal = useCallback(
    (date: Date | undefined) => {
      if (date) {
        const formatted = toSimpleDateString(date)
        onChangeDate(formatted)
      }
    },
    [onChangeDate],
  )

  useImperativeHandle(
    inputRef,
    () => ({
      focus: () => {
        Keyboard.dismiss()
        control.open()
      },
      blur: () => {
        control.close()
      },
    }),
    [control],
  )

  return (
    <>
      <DateFieldButton
        label={label}
        value={value}
        onPress={() => {
          Keyboard.dismiss()
          control.open()
        }}
        isInvalid={isInvalid}
        accessibilityHint={accessibilityHint}
      />
      <Dialog.Outer
        control={control}
        testID={testID}
        nativeOptions={{preventExpansion: true}}>
        <Dialog.Handle />
        <Dialog.ScrollableInner label={label}>
          <View style={a.gap_lg}>
            <View style={[a.relative, a.w_full, a.align_center]}>
              <DatePicker
                timeZoneOffsetInMinutes={0}
                theme={t.scheme}
                date={new Date(toSimpleDateString(value))}
                onDateChange={onChangeInternal}
                mode="date"
                locale={i18n.locale}
                testID={`${testID}-datepicker`}
                aria-label={label}
                accessibilityLabel={label}
                accessibilityHint={accessibilityHint}
                maximumDate={
                  maximumDate
                    ? new Date(toSimpleDateString(maximumDate))
                    : undefined
                }
              />
            </View>
            <Button
              label={_(msg`Done`)}
              onPress={() => control.close()}
              size="large"
              color="primary"
              variant="solid">
              <ButtonText>
                <Trans>Done</Trans>
              </ButtonText>
            </Button>
          </View>
        </Dialog.ScrollableInner>
      </Dialog.Outer>
    </>
  )
}
