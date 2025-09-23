import {useState} from 'react'
import {View} from 'react-native'
import {XRPCError} from '@atproto/xrpc'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {validate as validateEmail} from 'email-validator'

import {useCleanError} from '#/lib/hooks/useCleanError'
import {
  SupportCode,
  useCreateSupportLink,
} from '#/lib/hooks/useCreateSupportLink'
import {useGetTimeAgo} from '#/lib/hooks/useTimeAgo'
import {useTLDs} from '#/lib/hooks/useTLDs'
import {isEmailMaybeInvalid} from '#/lib/strings/email'
import {type AppLanguage} from '#/locale/languages'
import {useAgeAssuranceContext} from '#/state/ageAssurance'
import {useInitAgeAssurance} from '#/state/ageAssurance/useInitAgeAssurance'
import {logger} from '#/state/ageAssurance/util'
import {useLanguagePrefs} from '#/state/preferences'
import {useSession} from '#/state/session'
import {atoms as a, useTheme, web} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {AgeAssuranceBadge} from '#/components/ageAssurance/AgeAssuranceBadge'
import {urls} from '#/components/ageAssurance/const'
import {KWS_SUPPORTED_LANGS} from '#/components/ageAssurance/const'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Divider} from '#/components/Divider'
import * as TextField from '#/components/forms/TextField'
import {ShieldCheck_Stroke2_Corner0_Rounded as Shield} from '#/components/icons/Shield'
import {LanguageSelect} from '#/components/LanguageSelect'
import {InlineLinkText} from '#/components/Link'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

export {useDialogControl} from '#/components/Dialog/context'

export function AgeAssuranceInitDialog({
  control,
}: {
  control: Dialog.DialogControlProps
}) {
  const {_} = useLingui()
  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />

      <Dialog.ScrollableInner
        label={_(
          msg`Begin the age assurance process by completing the fields below.`,
        )}
        style={[
          web({
            maxWidth: 400,
          }),
        ]}>
        <Inner />
        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

function Inner() {
  const t = useTheme()
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const langPrefs = useLanguagePrefs()
  const cleanError = useCleanError()
  const {close} = Dialog.useDialogContext()
  const {lastInitiatedAt} = useAgeAssuranceContext()
  const getTimeAgo = useGetTimeAgo()
  const tlds = useTLDs()
  const createSupportLink = useCreateSupportLink()

  const wasRecentlyInitiated =
    lastInitiatedAt &&
    new Date(lastInitiatedAt).getTime() > Date.now() - 5 * 60 * 1000 // 5 minutes

  const [success, setSuccess] = useState(false)
  const [email, setEmail] = useState(currentAccount?.email || '')
  const [emailError, setEmailError] = useState<string>('')
  const [languageError, setLanguageError] = useState(false)
  const [disabled, setDisabled] = useState(false)
  const [language, setLanguage] = useState<string | undefined>(
    convertToKWSSupportedLanguage(langPrefs.appLanguage),
  )
  const [error, setError] = useState<React.ReactNode>(null)

  const {mutateAsync: init, isPending} = useInitAgeAssurance()

  const runEmailValidation = () => {
    if (validateEmail(email)) {
      setEmailError('')
      setDisabled(false)

      if (tlds && isEmailMaybeInvalid(email, tlds)) {
        setEmailError(
          _(
            msg`Please double-check that you have entered your email address correctly.`,
          ),
        )
        return {status: 'maybe'}
      }

      return {status: 'valid'}
    }

    setEmailError(_(msg`Please enter a valid email address.`))
    setDisabled(true)

    return {status: 'invalid'}
  }

  const onSubmit = async () => {
    setLanguageError(false)

    logger.metric('ageAssurance:initDialogSubmit', {})

    try {
      const {status} = runEmailValidation()

      if (status === 'invalid') return
      if (!language) {
        setLanguageError(true)
        return
      }

      await init({
        email,
        language,
      })

      setSuccess(true)
    } catch (e) {
      if (e instanceof XRPCError) {
        if (e.error === 'InvalidEmail') {
          setError(
            _(
              msg`Please enter a valid, non-temporary email address. You may need to access this email in the future.`,
            ),
          )
          logger.metric('ageAssurance:initDialogError', {code: 'InvalidEmail'})
        } else if (e.error === 'DidTooLong') {
          setError(
            <>
              <Trans>
                We're having issues initializing the age assurance process for
                your account. Please{' '}
                <InlineLinkText
                  to={createSupportLink({code: SupportCode.AA_DID, email})}
                  label={_(msg`Contact support`)}>
                  contact support
                </InlineLinkText>{' '}
                for assistance.
              </Trans>
            </>,
          )
          logger.metric('ageAssurance:initDialogError', {code: 'DidTooLong'})
        }
      } else {
        const {clean, raw} = cleanError(e)
        setError(clean || raw || _(msg`Something went wrong, please try again`))
        logger.metric('ageAssurance:initDialogError', {code: 'other'})
      }
    }
  }

  return (
    <View>
      <View style={[a.align_start]}>
        <AgeAssuranceBadge />

        <Text style={[a.text_xl, a.font_heavy, a.pt_xl, a.pb_md]}>
          {success ? <Trans>Success!</Trans> : <Trans>Verify your age</Trans>}
        </Text>

        <View style={[a.pb_xl, a.gap_sm]}>
          {success ? (
            <Text style={[a.text_sm, a.leading_snug]}>
              <Trans>
                Please check your email inbox for further instructions. It may
                take a minute or two to arrive.
              </Trans>
            </Text>
          ) : (
            <>
              <Text style={[a.text_sm, a.leading_snug]}>
                <Trans>
                  We use{' '}
                  <InlineLinkText
                    overridePresentation
                    disableMismatchWarning
                    label={_(msg`KWS website`)}
                    to={urls.kwsHome}
                    style={[a.text_sm, a.leading_snug]}>
                    KWS
                  </InlineLinkText>{' '}
                  to verify that you’re an adult. When you click "Begin" below,
                  KWS will email you instructions for verifying your age. When
                  you’re done, you'll be brought back to continue using Bluesky.
                </Trans>
              </Text>
              <Text style={[a.text_sm, a.leading_snug]}>
                <Trans>This should only take a few minutes.</Trans>
              </Text>
            </>
          )}
        </View>

        {success ? (
          <View style={[a.w_full]}>
            <Button
              label={_(msg`Close dialog`)}
              size="large"
              variant="solid"
              color="secondary"
              onPress={() => close()}>
              <ButtonText>
                <Trans>Close dialog</Trans>
              </ButtonText>
            </Button>
          </View>
        ) : (
          <>
            <Divider />

            <View style={[a.w_full, a.pt_xl, a.gap_lg, a.pb_lg]}>
              {wasRecentlyInitiated && (
                <Admonition type="warning">
                  <Trans>
                    You initiated this flow already,{' '}
                    {getTimeAgo(lastInitiatedAt, new Date(), {format: 'long'})}{' '}
                    ago. It may take up to 5 minutes for emails to reach your
                    inbox. Please consider waiting a few minutes before trying
                    again.
                  </Trans>
                </Admonition>
              )}

              <View>
                <TextField.LabelText>
                  <Trans>Your email</Trans>
                </TextField.LabelText>
                <TextField.Root isInvalid={!!emailError}>
                  <TextField.Input
                    label={_(msg`Your email`)}
                    placeholder={_(msg`Your email`)}
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setEmailError('')}
                    onBlur={() => {
                      runEmailValidation()
                    }}
                    returnKeyType="done"
                    autoCapitalize="none"
                    autoComplete="off"
                    autoCorrect={false}
                    onSubmitEditing={onSubmit}
                  />
                </TextField.Root>

                {emailError ? (
                  <Admonition type="error" style={[a.mt_sm]}>
                    {emailError}
                  </Admonition>
                ) : (
                  <Admonition type="tip" style={[a.mt_sm]}>
                    <Trans>
                      Use your account email address, or another real email
                      address you control, in case KWS or Bluesky needs to
                      contact you.
                    </Trans>
                  </Admonition>
                )}
              </View>

              <View>
                <TextField.LabelText>
                  <Trans>Your preferred language</Trans>
                </TextField.LabelText>
                <LanguageSelect
                  value={language}
                  onChange={value => {
                    setLanguage(value)
                    setLanguageError(false)
                  }}
                  items={KWS_SUPPORTED_LANGS}
                />

                {languageError && (
                  <Admonition type="error" style={[a.mt_sm]}>
                    <Trans>Please select a language</Trans>
                  </Admonition>
                )}
              </View>

              {error && <Admonition type="error">{error}</Admonition>}

              <Button
                disabled={disabled}
                label={_(msg`Begin age assurance process`)}
                size="large"
                variant="solid"
                color="primary"
                onPress={onSubmit}>
                <ButtonText>
                  <Trans>Begin</Trans>
                </ButtonText>
                <ButtonIcon
                  icon={isPending ? Loader : Shield}
                  position="right"
                />
              </Button>
            </View>

            <Text
              style={[a.text_xs, a.leading_snug, t.atoms.text_contrast_medium]}>
              <Trans>
                By continuing, you agree to the{' '}
                <InlineLinkText
                  overridePresentation
                  disableMismatchWarning
                  label={_(msg`KWS Terms of Use`)}
                  to={urls.kwsTermsOfUse}
                  style={[a.text_xs, a.leading_snug]}>
                  KWS Terms of Use
                </InlineLinkText>{' '}
                and acknowledge that KWS will store your verified status with
                your hashed email address in accordance with the{' '}
                <InlineLinkText
                  overridePresentation
                  disableMismatchWarning
                  label={_(msg`KWS Privacy Policy`)}
                  to={urls.kwsPrivacyPolicy}
                  style={[a.text_xs, a.leading_snug]}>
                  KWS Privacy Policy
                </InlineLinkText>
                . This means you won’t need to verify again the next time you
                use this email for other apps, games, and services powered by
                KWS technology.
              </Trans>
            </Text>
          </>
        )}
      </View>
    </View>
  )
}

// best-effort mapping of our languages to KWS supported languages
function convertToKWSSupportedLanguage(
  appLanguage: string,
): string | undefined {
  // `${Enum}` is how you get a type of string union of the enum values (???) -sfn
  switch (appLanguage as `${AppLanguage}`) {
    // only en is supported
    case 'en-GB':
      return 'en'
    // pt-PT is pt (pt-BR is supported independently)
    case 'pt-PT':
      return 'pt'
    // only chinese (simplified) is supported, map all chinese variants
    case 'zh-Hans-CN':
    case 'zh-Hant-HK':
    case 'zh-Hant-TW':
      return 'zh-Hans'
    default:
      // try and map directly - if undefined, they will have to pick from the dropdown
      return KWS_SUPPORTED_LANGS.find(v => v.value === appLanguage)?.value
  }
}
