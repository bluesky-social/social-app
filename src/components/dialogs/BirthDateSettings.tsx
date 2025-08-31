import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {cleanError} from '#/lib/strings/errors'
import {getAge, getDateAgo} from '#/lib/strings/time'
import {logger} from '#/logger'
import {isIOS, isWeb} from '#/platform/detection'
import {
  usePreferencesQuery,
  type UsePreferencesQueryResponse,
  usePreferencesSetBirthDateMutation,
} from '#/state/queries/preferences'
import {ErrorMessage} from '#/view/com/util/error/ErrorMessage'
import {atoms as a, useTheme, web} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {DateField} from '#/components/forms/DateField'
import {InlineLinkText} from '#/components/Link'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

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
        <View style={[a.gap_sm]}>
          <Text style={[a.text_xl, a.font_bold]}>
            <Trans>My Birthday</Trans>
          </Text>
          <Text style={[a.leading_snug, t.atoms.text_contrast_medium]}>
            <Trans>
              This information is private and not shared with other users.
            </Trans>
          </Text>

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
        </View>

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
  const [date, setDate] = React.useState(
    preferences.birthDate || getDateAgo(18),
  )
  const {
    isPending,
    isError,
    error,
    mutateAsync: setBirthDate,
  } = usePreferencesSetBirthDateMutation()
  const hasChanged = date !== preferences.birthDate

  const age = getAge(new Date(date))
  const isUnder13 = age < 13
  const isUnder18 = age >= 13 && age < 18

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

  return (
    <View style={a.gap_lg} testID="birthDateSettingsDialog">
      <View style={isIOS && [a.w_full, a.align_center]}>
        <DateField
          testID="birthdayInput"
          value={date}
          onChangeDate={newDate => setDate(new Date(newDate))}
          label={_(msg`Birthday`)}
          accessibilityHint={_(msg`Enter your birth date`)}
        />
      </View>

      {isUnder18 && hasChanged && (
        <Admonition type="info">
          <Trans>
            The birthdate you've entered means you are under 18 years old.
            Certain content and features may be unavailable to you.
          </Trans>
        </Admonition>
      )}

      {isUnder13 && (
        <Admonition type="error">
          <Trans>
            You must be at least 13 years old to use Bluesky. Read our{' '}
            <InlineLinkText
              to="https://bsky.social/about/support/tos"
              label={_(msg`Terms of Service`)}>
              Terms of Service
            </InlineLinkText>{' '}
            for more information.
          </Trans>
        </Admonition>
      )}

      {isError ? (
        <ErrorMessage message={cleanError(error)} style={[a.rounded_sm]} />
      ) : undefined}

      <View style={isWeb && [a.flex_row, a.justify_end]}>
        <Button
          label={hasChanged ? _(msg`Save birthday`) : _(msg`Done`)}
          size="large"
          onPress={onSave}
          variant="solid"
          color="primary"
          disabled={isUnder13}>
          <ButtonText>
            {hasChanged ? <Trans>Save</Trans> : <Trans>Done</Trans>}
          </ButtonText>
          {isPending && <ButtonIcon icon={Loader} />}
        </Button>
      </View>
    </View>
  )
}
