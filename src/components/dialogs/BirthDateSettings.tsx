import React from 'react'
import {useLingui} from '@lingui/react'
import {Trans, msg} from '@lingui/macro'

import * as Dialog from '#/components/Dialog'
import {Text} from '../Typography'
import {DateInput} from '#/view/com/util/forms/DateInput'
import {logger} from '#/logger'
import {
  usePreferencesSetBirthDateMutation,
  UsePreferencesQueryResponse,
} from '#/state/queries/preferences'
import {Button, ButtonText} from '../Button'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {ErrorMessage} from '#/view/com/util/error/ErrorMessage'
import {cleanError} from '#/lib/strings/errors'
import {ActivityIndicator, View} from 'react-native'

export function BirthDateSettingsDialog({
  control,
  preferences,
}: {
  control: Dialog.DialogControlProps
  preferences: UsePreferencesQueryResponse | undefined
}) {
  const {_} = useLingui()
  const {isPending, isError, error, mutateAsync} =
    usePreferencesSetBirthDateMutation()

  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <Dialog.Inner label={_(msg`My Birthday`)}>
        {preferences && !isPending ? (
          <BirthdayInner
            control={control}
            preferences={preferences}
            isError={isError}
            error={error}
            setBirthDate={mutateAsync}
          />
        ) : (
          <ActivityIndicator size="large" style={a.my_5xl} />
        )}
      </Dialog.Inner>
    </Dialog.Outer>
  )
}

function BirthdayInner({
  control,
  preferences,
  isError,
  error,
  setBirthDate,
}: {
  control: Dialog.DialogControlProps
  preferences: UsePreferencesQueryResponse
  isError: boolean
  error: unknown
  setBirthDate: (args: {birthDate: Date}) => Promise<unknown>
}) {
  const {_} = useLingui()
  const [date, setDate] = React.useState(preferences.birthDate || new Date())
  const t = useTheme()
  const {gtMobile} = useBreakpoints()

  const hasChanged = date !== preferences.birthDate

  const onSave = React.useCallback(async () => {
    try {
      // skip if date is the same
      if (hasChanged) {
        await setBirthDate({birthDate: date})
      }
      control.close()
    } catch (e) {
      logger.error(`setBirthDate failed`, {message: e})
    }
  }, [date, setBirthDate, control, hasChanged])

  return (
    <View style={a.gap_lg}>
      <View style={[a.gap_sm]}>
        <Text style={[a.text_2xl, a.font_bold]}>
          <Trans>My Birthday</Trans>
        </Text>
        <Text style={t.atoms.text_contrast_medium}>
          <Trans>This information is not shared with other users.</Trans>
        </Text>
      </View>
      <View style={[a.w_full, a.align_center]}>
        <DateInput
          handleAsUTC
          testID="birthdayInput"
          value={date}
          onChange={setDate}
          buttonType="default-light"
          buttonStyle={[a.rounded_sm]}
          buttonLabelType="lg"
          accessibilityLabel={_(msg`Birthday`)}
          accessibilityHint={_(msg`Enter your birth date`)}
          accessibilityLabelledBy="birthDate"
        />
      </View>
      {isError ? (
        <ErrorMessage message={cleanError(error)} style={[a.rounded_sm]} />
      ) : undefined}

      <View style={gtMobile && [a.flex_row, a.justify_end]}>
        <Button
          label={hasChanged ? _(msg`Save birthday`) : _(msg`Done`)}
          size={gtMobile ? 'small' : 'medium'}
          onPress={onSave}
          variant="solid"
          color="primary">
          <ButtonText>
            {hasChanged ? <Trans>Save</Trans> : <Trans>Done</Trans>}
          </ButtonText>
        </Button>
      </View>
    </View>
  )
}
