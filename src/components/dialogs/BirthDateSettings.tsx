/* eslint-disable @typescript-eslint/no-explicit-any */
import {useCallback, useMemo, useState} from 'react'
import {Linking, View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'
import {useQueryClient} from '@tanstack/react-query'

import {gateGetPreferences, gatePutPreferences} from '#/lib/api/gatekeeper'
import {useCleanError} from '#/lib/hooks/useCleanError'
import {useIsBlackskyPds} from '#/lib/hooks/useIsBlackskyPds'
import {isAppPassword} from '#/lib/jwt'
import {getAge, getDateAgo} from '#/lib/strings/time'
import {logger} from '#/logger'
import {
  preferencesQueryKey,
  usePreferencesQuery,
  type UsePreferencesQueryResponse,
} from '#/state/queries/preferences'
import {useAgent, useSession} from '#/state/session'
import {ErrorMessage} from '#/view/com/util/error/ErrorMessage'
import {atoms as a, useTheme, web} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {DateField} from '#/components/forms/DateField'
import * as TextField from '#/components/forms/TextField'
import {SimpleInlineLinkText} from '#/components/Link'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {IS_IOS, IS_WEB} from '#/env'

function isAppPasswordFormat(pw: string): boolean {
  return /^[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}$/i.test(pw)
}

// Types accepted by PDS putPreferences
const ALLOWED_PREF_TYPES = new Set([
  'app.bsky.actor.defs#adultContentPref',
  'app.bsky.actor.defs#contentLabelPref',
  'app.bsky.actor.defs#savedFeedsPref',
  'app.bsky.actor.defs#savedFeedsPrefV2',
  'app.bsky.actor.defs#personalDetailsPref',
  'app.bsky.actor.defs#feedViewPref',
  'app.bsky.actor.defs#threadViewPref',
  'app.bsky.actor.defs#interestsPref',
  'app.bsky.actor.defs#mutedWordsPref',
  'app.bsky.actor.defs#hiddenPostsPref',
  'app.bsky.actor.defs#bskyAppStatePref',
  'app.bsky.actor.defs#labelersPref',
  'app.bsky.actor.defs#postInteractionSettingsPref',
  'app.bsky.actor.defs#verificationPrefs',
  'app.bsky.actor.defs#liveEventPreferences',
])

export function BirthDateSettingsDialog({
  control,
}: {
  control: Dialog.DialogControlProps
}) {
  const t = useTheme()
  const {_} = useLingui()
  const {isLoading, error, data: preferences} = usePreferencesQuery()
  const {currentAccount} = useSession()
  const isUsingAppPassword = isAppPassword(currentAccount?.accessJwt || '')
  const isOauth = currentAccount?.isOauthSession === true
  const isBskyPds = useIsBlackskyPds()
  const useGatekeeper = isOauth && isBskyPds

  return (
    <Dialog.Outer control={control} nativeOptions={{preventExpansion: true}}>
      <Dialog.Handle />
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
                To update your birthdate, please sign in with your main account
                password instead of an app password.
              </Trans>
            </Admonition>
          ) : isOauth && !isBskyPds ? (
            <OAuthExternalPdsMessage serviceUrl={currentAccount?.service} />
          ) : useGatekeeper ? (
            <GatekeeperBirthdayFlow control={control} />
          ) : (
            <DirectBirthdayFlow control={control} preferences={preferences} />
          )}
        </View>

        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

function OAuthExternalPdsMessage({serviceUrl}: {serviceUrl?: string}) {
  const {_} = useLingui()
  const pdsAccountUrl = serviceUrl ? `${serviceUrl}/account` : undefined

  return (
    <View style={a.gap_lg}>
      <Admonition type="info">
        <Trans>
          Birthdate updates are not available when signed in with OAuth. Please
          manage your birthdate through your hosting provider's website.
        </Trans>
      </Admonition>

      {pdsAccountUrl && (
        <Button
          label={_(msg`Open account settings`)}
          size="large"
          variant="solid"
          color="primary"
          onPress={() => Linking.openURL(pdsAccountUrl)}>
          <ButtonText>
            <Trans>Open Account Settings</Trans>
          </ButtonText>
        </Button>
      )}
    </View>
  )
}

function GatekeeperBirthdayFlow({
  control,
}: {
  control: Dialog.DialogControlProps
}) {
  const {_} = useLingui()
  const cleanError = useCleanError()
  const {currentAccount} = useSession()
  const queryClient = useQueryClient()

  const [password, setPassword] = useState('')
  const [fullPrefs, setFullPrefs] = useState<any[] | null>(null)
  const [date, setDate] = useState<Date>(getDateAgo(18))
  const [originalDate, setOriginalDate] = useState<Date | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadPreferences = useCallback(async () => {
    if (!currentAccount || !password) return
    setIsPending(true)
    setError(null)
    try {
      const result = await gateGetPreferences({
        serviceUrl: currentAccount.service,
        did: currentAccount.did,
        password,
      })
      setFullPrefs(result.preferences)
      const personalPref = result.preferences.find(
        (p: any) => p.$type === 'app.bsky.actor.defs#personalDetailsPref',
      )
      if (personalPref?.birthDate) {
        const bd = new Date(personalPref.birthDate)
        setDate(bd)
        setOriginalDate(bd)
      }
    } catch (e: any) {
      const {clean} = cleanError(e)
      setError(clean || e?.message || 'Failed to load preferences')
    } finally {
      setIsPending(false)
    }
  }, [currentAccount, password, cleanError])

  const saveBirthDate = useCallback(async () => {
    if (!currentAccount || !fullPrefs) return
    setIsPending(true)
    setError(null)
    try {
      // Filter to PDS-accepted types, excluding read-only declaredAgePref
      const pdsPrefs = fullPrefs.filter((p: any) =>
        ALLOWED_PREF_TYPES.has(p.$type),
      )

      const personalDetailsIdx = pdsPrefs.findIndex(
        (p: any) => p.$type === 'app.bsky.actor.defs#personalDetailsPref',
      )
      const personalDetails = {
        $type: 'app.bsky.actor.defs#personalDetailsPref',
        birthDate: date.toISOString(),
      }
      const updatedPrefs =
        personalDetailsIdx >= 0
          ? pdsPrefs.map((p: any, i: number) =>
              i === personalDetailsIdx ? personalDetails : p,
            )
          : [...pdsPrefs, personalDetails]

      const {status} = await gatePutPreferences({
        serviceUrl: currentAccount.service,
        did: currentAccount.did,
        password,
        preferences: updatedPrefs,
      })

      if (status === 'authFactorTokenRequired') {
        setError('Email 2FA is required but not supported for this action yet.')
        return
      }

      setOriginalDate(date)
      await queryClient.invalidateQueries({queryKey: preferencesQueryKey})
      control.close()
    } catch (e: any) {
      logger.error('setBirthDate failed', {message: e?.message})
      const {clean} = cleanError(e)
      setError(clean || e?.message || 'Failed to save birthdate')
    } finally {
      setIsPending(false)
    }
  }, [
    currentAccount,
    fullPrefs,
    date,
    password,
    queryClient,
    control,
    cleanError,
  ])

  const hasChanged =
    originalDate === null || date.toISOString() !== originalDate.toISOString()
  const age = getAge(new Date(date))
  const isUnder13 = age < 13
  const isUnder18 = age >= 13 && age < 18
  const isAppPw = isAppPasswordFormat(password)

  if (!fullPrefs) {
    // Step 1: Enter password to load preferences
    return (
      <View style={a.gap_lg} testID="birthDateSettingsDialog">
        <View>
          <TextField.LabelText>
            <Trans>Account password</Trans>
          </TextField.LabelText>
          <TextField.Root>
            <TextField.Input
              testID="birthdayPasswordInput"
              label={_(msg`Account password`)}
              defaultValue={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
              onSubmitEditing={loadPreferences}
            />
          </TextField.Root>
          {isAppPw && (
            <Admonition type="error">
              <Trans>
                App passwords cannot be used here. Please enter your main
                account password.
              </Trans>
            </Admonition>
          )}
        </View>

        {error ? <ErrorMessage message={error} style={[a.rounded_sm]} /> : null}

        <View style={IS_WEB && [a.flex_row, a.justify_end]}>
          <Button
            label={_(msg`Load birthdate`)}
            size="large"
            onPress={loadPreferences}
            variant="solid"
            color="primary"
            disabled={!password || isAppPw || isPending}>
            <ButtonText>
              <Trans>Continue</Trans>
            </ButtonText>
            {isPending && <ButtonIcon icon={Loader} />}
          </Button>
        </View>
      </View>
    )
  }

  // Step 2: Edit and save birthdate
  return (
    <View style={a.gap_lg} testID="birthDateSettingsDialog">
      <View style={IS_IOS && [a.w_full, a.align_center]}>
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
            You must be at least 13 years old to use Blacksky. Read our{' '}
            <SimpleInlineLinkText
              to="https://www.blackskyweb.xyz/about/support/tos"
              label={_(msg`Terms of Service`)}>
              Terms of Service
            </SimpleInlineLinkText>{' '}
            for more information.
          </Trans>
        </Admonition>
      )}

      {error ? <ErrorMessage message={error} style={[a.rounded_sm]} /> : null}

      <View style={IS_WEB && [a.flex_row, a.justify_end]}>
        <Button
          label={hasChanged ? _(msg`Save birthdate`) : _(msg`Done`)}
          size="large"
          onPress={hasChanged ? saveBirthDate : () => control.close()}
          variant="solid"
          color="primary"
          disabled={isUnder13 || isPending}>
          <ButtonText>
            {hasChanged ? <Trans>Save</Trans> : <Trans>Done</Trans>}
          </ButtonText>
          {isPending && <ButtonIcon icon={Loader} />}
        </Button>
      </View>
    </View>
  )
}

function DirectBirthdayFlow({
  control,
  preferences,
}: {
  control: Dialog.DialogControlProps
  preferences: UsePreferencesQueryResponse
}) {
  const {_} = useLingui()
  const cleanError = useCleanError()
  const [date, setDate] = useState(preferences.birthDate || getDateAgo(18))
  const agent = useAgent()
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const hasChanged = date !== preferences.birthDate
  const errorMessage = useMemo(() => {
    if (error) {
      const {raw, clean} = cleanError(error)
      return clean || raw || error.toString()
    }
  }, [error, cleanError])

  const age = getAge(new Date(date))
  const isUnder13 = age < 13
  const isUnder18 = age >= 13 && age < 18

  const onSave = useCallback(async () => {
    setIsPending(true)
    setError(null)
    try {
      if (hasChanged) {
        await agent.setPersonalDetails({birthDate: date.toISOString()})
      }
      control.close()
    } catch (e: any) {
      setError(e)
      logger.error('setBirthDate failed', {message: e.message})
    } finally {
      setIsPending(false)
    }
  }, [date, agent, control, hasChanged])

  return (
    <View style={a.gap_lg} testID="birthDateSettingsDialog">
      <View style={IS_IOS && [a.w_full, a.align_center]}>
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
            You must be at least 13 years old to use Blacksky. Read our{' '}
            <SimpleInlineLinkText
              to="https://www.blackskyweb.xyz/about/support/tos"
              label={_(msg`Terms of Service`)}>
              Terms of Service
            </SimpleInlineLinkText>{' '}
            for more information.
          </Trans>
        </Admonition>
      )}

      {errorMessage ? (
        <ErrorMessage message={errorMessage} style={[a.rounded_sm]} />
      ) : null}

      <View style={IS_WEB && [a.flex_row, a.justify_end]}>
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
