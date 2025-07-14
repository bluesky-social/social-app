import {useState} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {validate as validateEmail} from 'email-validator'

import {useLanguagePrefs} from '#/state/preferences'
import {useSession} from '#/state/session'
import {atoms as a, useTheme, web} from '#/alf'
import {AgeAssuranceBadge} from '#/components/ageAssurance/AgeAssuranceBadge'
import {urls} from '#/components/ageAssurance/const'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Divider} from '#/components/Divider'
import * as TextField from '#/components/forms/TextField'
import {Envelope_Stroke2_Corner0_Rounded as Envelope} from '#/components/icons/Envelope'
import {LanguageSelect} from '#/components/LanguageSelect'
import {InlineLinkText} from '#/components/Link'
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
          'Begin the age assurance process by completing the fields below.',
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

  const [email, setEmail] = useState(currentAccount?.email || '')
  const [emailValid, setEmailValid] = useState(validateEmail(email))
  const [language, setLanguage] = useState(langPrefs.appLanguage)

  const onSubmit = async () => {
    try {
      if (!validateEmail(email)) {
        setEmailValid(false)
        return
      }
    } catch (e) {}
  }

  return (
    <View>
      <View style={[a.align_start]}>
        <AgeAssuranceBadge />

        <Text style={[a.text_xl, a.font_heavy, a.pt_xl, a.pb_md]}>
          <Trans>Verify your age</Trans>
        </Text>

        <View style={[a.pb_xl, a.gap_sm]}>
          <Text style={[a.text_sm, a.leading_snug]}>
            <Trans>
              We use{' '}
              <InlineLinkText
                label={urls.kwsHome}
                to={urls.kwsHome}
                style={[a.text_sm, a.leading_snug]}>
                KWS
              </InlineLinkText>{' '}
              to verify that you’re an adult. When you click "Get an email"
              below, Bluesky will share your email address with KWS.
            </Trans>
          </Text>
          <Text style={[a.text_sm, a.leading_snug]}>
            <Trans>
              If KWS cannot use your email address to confirm that you
              previously verified your age, you’ll be taken to the KWS website
              to provide more details.
            </Trans>
          </Text>
          <Text style={[a.text_sm, a.leading_snug]}>
            <Trans>This should only take a few minutes.</Trans>
          </Text>
        </View>

        <Divider />

        <View style={[a.w_full, a.pt_xl, a.gap_md]}>
          <View>
            <TextField.LabelText>
              <Trans>Your email</Trans>
            </TextField.LabelText>
            <TextField.Root isInvalid={!emailValid}>
              <TextField.Input
                label={_(msg`Your email`)}
                placeholder={_(msg`Your email`)}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setEmailValid(true)}
                onBlur={() => {
                  setEmailValid(validateEmail(email))
                }}
                returnKeyType="done"
                autoCapitalize="none"
                autoComplete="off"
                autoCorrect={false}
                onSubmitEditing={onSubmit}
              />
            </TextField.Root>
          </View>

          <View>
            <TextField.LabelText>
              <Trans>Your preferred language</Trans>
            </TextField.LabelText>
            <LanguageSelect value={language} onChange={setLanguage} />
          </View>

          <Button
            label={_(msg`Get an email`)}
            size="large"
            variant="solid"
            color="primary">
            <ButtonText>
              <Trans>Get an email</Trans>
            </ButtonText>
            <ButtonIcon icon={Envelope} position="right" />
          </Button>
        </View>

        <Text
          style={[
            a.text_xs,
            a.leading_snug,
            a.pt_lg,
            t.atoms.text_contrast_medium,
          ]}>
          <Trans>
            By continuing, you agree to the{' '}
            <InlineLinkText
              label={urls.kwsTermsOfUse}
              to={urls.kwsTermsOfUse}
              style={[a.text_xs, a.leading_snug]}>
              KWS Terms of Use
            </InlineLinkText>{' '}
            and acknowledge that KWS will store your verified status alongside
            your hashed email address in accordance with the{' '}
            <InlineLinkText
              label={urls.kwsPrivacyPolicy}
              to={urls.kwsPrivacyPolicy}
              style={[a.text_xs, a.leading_snug]}>
              KWS Privacy Policy
            </InlineLinkText>
            . This means you won’t need to verify again the next time you use
            this email for other apps, games, and services powered by KWS
            technology.
          </Trans>
        </Text>
      </View>
    </View>
  )
}
