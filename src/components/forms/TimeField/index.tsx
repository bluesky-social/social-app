import {useCallback, useImperativeHandle} from 'react'
import {Keyboard, View} from 'react-native'
import DatePicker from 'react-native-date-picker'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
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
  testID,
  label,
  isInvalid,
  accessibilityHint,
  minimumDate,
  maximumDate,
}: TimeFieldProps) {
  const {_} = useLingui()
  const t = useTheme()
  const control = Dialog.useDialogControl()

  const onChangeInternal = useCallback(
    (date: Date | undefined) => {
      if (date) {
        const formatted = toDateString(date)
        onChangeDate(formatted)
      }
    },
    [onChangeDate],
  )

  useImperativeHandle(
    ref,
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
    <View style={[]}>
      <TimeFieldButton
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
                date={new Date(toDateString(value))}
                onDateChange={onChangeInternal}
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
    </View>
  )
}
