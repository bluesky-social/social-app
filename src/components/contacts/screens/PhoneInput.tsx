import {useState} from 'react'
import {Keyboard, View} from 'react-native'
import {KeyboardAvoidingView} from 'react-native-keyboard-controller'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useMutation} from '@tanstack/react-query'

import {
  type CountryCode,
  getDefaultCountry,
} from '#/lib/international-telephone-codes'
import {cleanError, isNetworkError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {useAgent} from '#/state/session'
import {android, atoms as a, tokens, useGutters, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as TextField from '#/components/forms/TextField'
import {InternationalPhoneCodeSelect} from '#/components/InternationalPhoneCodeSelect'
import * as Layout from '#/components/Layout'
import {InlineLinkText} from '#/components/Link'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {useGeolocation} from '#/geolocation'
import {isFindContactsFeatureEnabled} from '../country-whitelist'
import {
  constructFullPhoneNumber,
  getCountryCodeFromPastedNumber,
  processPhoneNumber,
} from '../phone-number'
import {type Action, type State, useOnPressBackButton} from '../state'

export function PhoneInput({
  state,
  dispatch,
  showSkipButton,
  onSkip,
}: {
  state: Extract<State, {step: '1: phone input'}>
  dispatch: React.Dispatch<Action>
  showSkipButton: boolean
  onSkip: () => void
}) {
  const {_} = useLingui()
  const t = useTheme()
  const agent = useAgent()
  const location = useGeolocation()
  const [countryCode, setCountryCode] = useState(
    () => state.phoneCountryCode ?? getDefaultCountry(location),
  )
  const [phoneNumber, setPhoneNumber] = useState(state.phoneNumber ?? '')
  const gutters = useGutters([0, 'wide'])
  const insets = useSafeAreaInsets()
  // for API/generic errors
  const [error, setError] = useState('')
  // for issues with parsing the number
  const [formatError, setFormatError] = useState('')

  const {mutate: submit, isPending} = useMutation({
    mutationFn: async ({
      phoneCountryCode,
      phoneNumber,
    }: {
      phoneCountryCode: CountryCode
      phoneNumber: string
    }) => {
      // sends a onetime code to the user's phone number
      await agent.app.bsky.contact.startPhoneVerification({
        phone: constructFullPhoneNumber(phoneCountryCode, phoneNumber),
      })
    },
    onSuccess: (_data, {phoneCountryCode, phoneNumber}) => {
      dispatch({
        type: 'SUBMIT_PHONE_NUMBER',
        payload: {phoneCountryCode, phoneNumber},
      })
    },
    onMutate: () => {
      Keyboard.dismiss()
      setError('')
      setFormatError('')
    },
    onError: err => {
      if (isNetworkError(err)) {
        setError(
          _(
            msg`A network error occurred. Please check your internet connection`,
          ),
        )
      } else {
        logger.error('Verify phone number failed', {safeMessage: err})
        setError(_(msg`An error occurred. ${cleanError(err)}`))
      }
    },
  })

  const isFeatureEnabled = isFindContactsFeatureEnabled(countryCode)

  const onSubmitNumber = () => {
    if (!isFeatureEnabled) return
    const result = processPhoneNumber(phoneNumber, countryCode)
    if (result.valid) {
      setPhoneNumber(result.formatted)
      submit({phoneCountryCode: countryCode, phoneNumber: result.formatted})
    } else {
      setFormatError(result.reason ?? _(msg`Invalid phone number`))
    }
  }

  const paddingBottom = Math.max(insets.bottom, tokens.space.xl)

  const onPressBack = useOnPressBackButton()

  return (
    <View style={[a.h_full]}>
      <Layout.Header.Outer noBottomBorder>
        <Layout.Header.BackButton onPress={onPressBack} />
        <Layout.Header.Content />
        {showSkipButton ? (
          <Button
            size="small"
            color="secondary"
            variant="ghost"
            label={_(msg`Skip contact sharing and continue to the app`)}
            onPress={onSkip}>
            <ButtonText>
              <Trans>Skip</Trans>
            </ButtonText>
          </Button>
        ) : (
          <Layout.Header.Slot />
        )}
      </Layout.Header.Outer>
      <Layout.Content
        contentContainerStyle={[gutters, a.pt_sm, a.flex_1]}
        keyboardShouldPersistTaps="handled">
        <Text style={[a.font_bold, a.text_3xl]}>
          <Trans>Verify phone number</Trans>
        </Text>
        <Text
          style={[
            a.text_md,
            t.atoms.text_contrast_medium,
            a.leading_snug,
            a.mt_sm,
          ]}>
          <Trans>
            We need to verify your number before we can look for your friends. A
            verification code will be sent to this number.
          </Trans>
        </Text>

        <View style={[a.mt_2xl]}>
          <TextField.LabelText>
            <Trans>Phone number</Trans>
          </TextField.LabelText>
          <View style={[a.flex_row, a.gap_sm, a.align_center]}>
            <View>
              <InternationalPhoneCodeSelect
                value={countryCode}
                onChange={value => setCountryCode(value)}
              />
            </View>
            <View style={[a.flex_1]}>
              <TextField.Root isInvalid={!!formatError || !isFeatureEnabled}>
                <TextField.Input
                  label={_(msg`Phone number`)}
                  value={phoneNumber}
                  onChangeText={text => {
                    if (formatError) setFormatError('')
                    if (Math.abs(text.length - phoneNumber.length) > 1) {
                      // possibly pasted/autocompleted? auto-switch
                      // country code if possible
                      const result = getCountryCodeFromPastedNumber(text)
                      if (result) {
                        setCountryCode(result.countryCode)
                        setPhoneNumber(result.rest)
                        return
                      }
                    }
                    setPhoneNumber(text)
                  }}
                  placeholder={null}
                  keyboardType="number-pad" // we don't want people entering +() etc
                  autoComplete="tel"
                  returnKeyType={android('next')}
                  onSubmitEditing={onSubmitNumber}
                />
              </TextField.Root>
            </View>
          </View>
        </View>

        {!isFeatureEnabled && (
          <ErrorText>
            <Trans>
              Support for this feature in your country has not been enabled yet!
              Please check back later.
            </Trans>
          </ErrorText>
        )}
        {error && <ErrorText>{error}</ErrorText>}
        {formatError && <ErrorText>{formatError}</ErrorText>}

        <View style={[a.mt_auto, a.py_xl]}>
          <LegalDisclaimer />
        </View>
      </Layout.Content>
      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={insets.top - paddingBottom + tokens.space.xl}>
        <View style={[gutters, {paddingBottom}]}>
          <Button
            disabled={!phoneNumber || isPending}
            label={_(msg`Send code`)}
            size="large"
            color="primary"
            onPress={onSubmitNumber}>
            <ButtonText>
              <Trans>Send code</Trans>
            </ButtonText>
            {isPending && <ButtonIcon icon={Loader} />}
          </Button>
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}

function LegalDisclaimer() {
  const t = useTheme()
  const {_} = useLingui()

  const style = [a.text_xs, t.atoms.text_contrast_medium, a.leading_snug]

  return (
    <View style={[a.gap_xs]}>
      <Text style={[style, a.font_medium]}>
        <Trans>How we use your number:</Trans>
      </Text>
      <Text style={style}>
        &bull;{' '}
        <Trans>Sent to our phone number verification provider Plivo</Trans>
      </Text>
      <Text style={style}>
        &bull; <Trans>Deleted by the verifier after verification</Trans>
      </Text>
      <Text style={style}>
        &bull;{' '}
        <Trans>Held by Bluesky for 7 days to prevent abuse, then deleted</Trans>
      </Text>
      <Text style={style}>
        &bull;{' '}
        <Trans>Stored as part of a secure code for matching with others</Trans>
      </Text>
      <Text style={[style, a.mt_xs]}>
        <Trans>
          By continuing, you consent to this use. You may change your mind any
          time by visiting settings.{' '}
          <InlineLinkText
            to="#"
            label={_(msg`Learn more`)}
            style={[a.text_xs, a.leading_snug]}>
            TODO: Learn more
          </InlineLinkText>
        </Trans>
      </Text>
    </View>
  )
}

function ErrorText({children}: {children: React.ReactNode}) {
  const t = useTheme()
  return (
    <Text
      style={[
        a.text_md,
        {color: t.palette.negative_500},
        a.leading_snug,
        a.mt_md,
      ]}>
      {children}
    </Text>
  )
}
