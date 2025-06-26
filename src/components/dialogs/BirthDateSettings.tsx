import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {cleanError} from '#/lib/strings/errors'
import {getDateAgo, simpleAreDatesEqual} from '#/lib/strings/time'
import {logger} from '#/logger'
import {isIOS, isWeb} from '#/platform/detection'
import {
  usePreferencesQuery,
  type UsePreferencesQueryResponse,
  usePreferencesSetBirthDateMutation,
} from '#/state/queries/preferences'
import {ErrorMessage} from '#/view/com/util/error/ErrorMessage'
import {is13} from '#/screens/Signup/state'
import {atoms as a, platform, useTheme, web} from '#/alf'
import * as Dialog from '#/components/Dialog'
import {DateField} from '#/components/forms/DateField'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {Button, ButtonIcon, ButtonText} from '../Button'

export function BirthDateSettingsDialog({
  control,
}: {
  control: Dialog.DialogControlProps
}) {
  const t = useTheme()
  const {_} = useLingui()
  const {isLoading, error, data: preferences} = usePreferencesQuery()

  return (
    <Dialog.Outer control={control} nativeOptions={{preventExpansion: true}}>
      <Dialog.Handle />
      <Dialog.ScrollableInner
        label={_(msg`My Birthday`)}
        style={web({maxWidth: 400})}>
        <View style={[a.gap_sm, a.pb_lg]}>
          <Text style={[a.text_2xl, a.font_heavy]}>
            <Trans>My Birthday</Trans>
          </Text>
          <Text style={[a.text_md, t.atoms.text_contrast_medium]}>
            <Trans>This information is not shared with other users.</Trans>
          </Text>
        </View>

        {isLoading ? (
          <Loader size="xl" />
        ) : error || !preferences ? (
          <ErrorMessage
            message={
              error?.toString() ||
              _(
                msg`We were unable to load your birth date preferences. Please try again.`,
              )
            }
            style={[a.rounded_sm]}
          />
        ) : (
          <BirthdayInner control={control} preferences={preferences} />
        )}

        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

function BirthdayInner({
  control,
  preferences,
}: {
  control: Dialog.DialogControlProps
  preferences: UsePreferencesQueryResponse
}) {
  const {_} = useLingui()
  const t = useTheme()
  const [date, setDate] = React.useState(preferences.birthDate || new Date())
  const {
    isPending,
    isError,
    error,
    mutateAsync: setBirthDate,
  } = usePreferencesSetBirthDateMutation()
  const hasChanged =
    !preferences.birthDate || !simpleAreDatesEqual(date, preferences.birthDate)

  const onSave = React.useCallback(async () => {
    try {
      // skip if date is the same
      if (hasChanged) {
        await setBirthDate({birthDate: date})
      }
      control.close()
    } catch (e: any) {
      logger.error(`setBirthDate failed`, {message: e.message})
    }
  }, [date, setBirthDate, control, hasChanged])

  const isUnder13 = !is13(date)

  return (
    <View style={a.gap_lg} testID="birthDateSettingsDialog">
      <View style={isIOS && [a.w_full, a.align_center]}>
        <DateField
          testID="birthdayInput"
          value={date}
          onChangeDate={newDate => setDate(new Date(newDate))}
          label={_(msg`Birthday`)}
          accessibilityHint={_(msg`Enter your birth date`)}
          maximumDate={getDateAgo(13)}
        />
      </View>

      {isError ? (
        <ErrorMessage message={cleanError(error)} style={[a.rounded_sm]} />
      ) : undefined}

      {isUnder13 && (
        <Text style={[a.font_bold, t.atoms.text_contrast_high]}>
          <Trans>You must be at least 13 years of age.</Trans>
        </Text>
      )}

      <View style={isWeb && [a.flex_row, a.justify_end, a.gap_sm]}>
        {isWeb && (
          <Button
            label={_(msg`Cancel`)}
            size="small"
            onPress={() => control.close()}
            variant="solid"
            color="secondary">
            <ButtonText>
              <Trans>Cancel</Trans>
            </ButtonText>
          </Button>
        )}
        <Button
          label={hasChanged || isWeb ? _(msg`Save birthday`) : _(msg`Done`)}
          size={platform({
            native: 'large',
            web: 'small',
          })}
          onPress={onSave}
          variant="solid"
          color="primary"
          disabled={isUnder13 || (isWeb && !hasChanged)}>
          <ButtonText>
            {hasChanged || isWeb ? <Trans>Save</Trans> : <Trans>Done</Trans>}
          </ButtonText>
          {isPending && <ButtonIcon icon={Loader} />}
        </Button>
      </View>
    </View>
  )
}
