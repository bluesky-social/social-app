import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useCleanError} from '#/lib/hooks/useCleanError'
import {isAppPassword} from '#/lib/jwt'
import {getAge, getDateAgo} from '#/lib/strings/time'
import {logger} from '#/logger'
import {isIOS, isWeb} from '#/platform/detection'
import {
  useBirthdateMutation,
  useIsBirthdateUpdateAllowed,
} from '#/state/birthdate'
import {
  usePreferencesQuery,
  type UsePreferencesQueryResponse,
} from '#/state/queries/preferences'
import {useSession} from '#/state/session'
import {ErrorMessage} from '#/view/com/util/error/ErrorMessage'
import {atoms as a, useTheme, web} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {DateField} from '#/components/forms/DateField'
import {SimpleInlineLinkText} from '#/components/Link'
import {Loader} from '#/components/Loader'
import {Span, Text} from '#/components/Typography'

export function BirthDateSettingsDialog({
  control,
}: {
  control: Dialog.DialogControlProps
}) {
  const t = useTheme()
  const {_} = useLingui()
  const {isLoading, error, data: preferences} = usePreferencesQuery()
  const isBirthdateUpdateAllowed = useIsBirthdateUpdateAllowed()
  const {currentAccount} = useSession()
  const isUsingAppPassword = isAppPassword(currentAccount?.accessJwt || '')

  return (
    <Dialog.Outer control={control} nativeOptions={{preventExpansion: true}}>
      <Dialog.Handle />
      {isBirthdateUpdateAllowed ? (
        <Dialog.ScrollableInner
          label={_(msg`My Birthdate`)}
          style={web({maxWidth: 400})}>
          <View style={[a.gap_md]}>
            <Text style={[a.text_xl, a.font_semi_bold]}>
              <Trans>My Birthdate</Trans>
            </Text>
            <Text
              style={[a.text_md, a.leading_snug, t.atoms.text_contrast_medium]}>
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
                    msg`We were unable to load your birthdate preferences. Please try again.`,
                  )
                }
                style={[a.rounded_sm]}
              />
            ) : isUsingAppPassword ? (
              <Admonition type="info">
                <Trans>
                  Hmm, it looks like you're logged in with an{' '}
                  <Span style={[a.italic]}>App Password</Span>. To set your
                  birthdate, you'll need to log in with your main account
                  password, or ask whomever controls this account to do so.
                </Trans>
              </Admonition>
            ) : (
              <BirthdayInner control={control} preferences={preferences} />
            )}
          </View>

          <Dialog.Close />
        </Dialog.ScrollableInner>
      ) : (
        <Dialog.ScrollableInner
          label={_(msg`You recently changed your birthdate`)}
          style={web({maxWidth: 400})}>
          <View style={[a.gap_sm]}>
            <Text
              style={[
                a.text_xl,
                a.font_semi_bold,
                a.leading_snug,
                {paddingRight: 32},
              ]}>
              <Trans>You recently changed your birthdate</Trans>
            </Text>
            <Text
              style={[a.text_md, a.leading_snug, t.atoms.text_contrast_medium]}>
              <Trans>
                There is a limit to how often you can change your birthdate. You
                may need to wait a day or two before updating it again.
              </Trans>
            </Text>
          </View>

          <Dialog.Close />
        </Dialog.ScrollableInner>
      )}
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
  const cleanError = useCleanError()
  const [date, setDate] = React.useState(
    preferences.birthDate || getDateAgo(18),
  )
  const {isPending, error, mutateAsync: setBirthDate} = useBirthdateMutation()
  const hasChanged = date !== preferences.birthDate
  const errorMessage = React.useMemo(() => {
    if (error) {
      const {raw, clean} = cleanError(error)
      return clean || raw || error.toString()
    }
  }, [error, cleanError])

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
          label={_(msg`Birthdate`)}
          accessibilityHint={_(msg`Enter your birthdate`)}
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
            <SimpleInlineLinkText
              to="https://bsky.social/about/support/tos"
              label={_(msg`Terms of Service`)}>
              Terms of Service
            </SimpleInlineLinkText>{' '}
            for more information.
          </Trans>
        </Admonition>
      )}

      {errorMessage ? (
        <ErrorMessage message={errorMessage} style={[a.rounded_sm]} />
      ) : undefined}

      <View style={isWeb && [a.flex_row, a.justify_end]}>
        <Button
          label={hasChanged ? _(msg`Save birthdate`) : _(msg`Done`)}
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
