import {useState} from 'react'
import {View} from 'react-native'
import {KeyboardAvoidingView} from 'react-native-keyboard-controller'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useMutation} from '@tanstack/react-query'

import {getDefaultCountry} from '#/lib/international-telephone-codes'
import {isNetworkError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {isAndroid} from '#/platform/detection'
import {useGeolocationStatus} from '#/state/geolocation'
import {atoms as a, tokens, useGutters, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as TextField from '#/components/forms/TextField'
import {InternationalPhoneCodeSelect} from '#/components/InternationalPhoneCodeSelect'
import * as Layout from '#/components/Layout'
import {InlineLinkText} from '#/components/Link'
import {Loader} from '#/components/Loader'
import {P, Text} from '#/components/Typography'
import {type Action, type State} from '../state'

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
  const {location} = useGeolocationStatus()
  const [phoneCode, setPhoneCode] = useState(
    () => state.phoneCode ?? getDefaultCountry(location),
  )
  const [phoneNumber, setPhoneNumber] = useState(state.phoneNumber ?? '')
  const gutters = useGutters([0, 'wide'])
  const insets = useSafeAreaInsets()
  const [error, setError] = useState('')

  const {mutate: submit, isPending} = useMutation({
    mutationFn: async ({}: {phoneCode: string; phoneNumber: string}) => {
      // get otp
      await new Promise(resolve => {
        setTimeout(resolve, 1000)
      })
    },
    onSuccess: (_data, {phoneCode, phoneNumber}) => {
      dispatch({type: 'VERIFY_PHONE', payload: {phoneCode, phoneNumber}})
    },
    onMutate: () => setError(''),
    onError: err => {
      if (isNetworkError(err)) {
        setError(
          _(
            msg`A network error occurred. Please check your internet connection.`,
          ),
        )
      } else {
        logger.error('Verify phone number failed', {safeMessage: err})
        setError(_(msg`An error occurred. Please try again later.`))
      }
    },
  })

  return (
    <View style={[a.h_full]}>
      <Layout.Header.Outer noBottomBorder>
        <Layout.Header.BackButton />
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
      <Layout.Content contentContainerStyle={[gutters, a.pt_sm, a.flex_1]}>
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
                value={phoneCode}
                onChange={value => setPhoneCode(value)}
              />
            </View>
            <View style={[a.flex_1]}>
              <TextField.Root>
                <TextField.Input
                  label={_(msg`Phone number`)}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder={null}
                  keyboardType="phone-pad"
                  autoComplete={isAndroid ? 'tel-national' : 'tel'}
                />
              </TextField.Root>
            </View>
          </View>
        </View>
        {error && (
          <Text
            style={[
              a.text_md,
              t.atoms.text_contrast_medium,
              a.leading_snug,
              a.mt_xl,
            ]}>
            {error}
          </Text>
        )}
        <View style={[a.mt_auto, a.py_xl]}>
          <LegalDisclaimer />
        </View>
      </Layout.Content>
      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={insets.top - insets.bottom + tokens.space.xl}>
        <View style={[gutters, {paddingBottom: insets.bottom}]}>
          <Button
            disabled={!phoneNumber || isPending}
            label={_(msg`Next`)}
            size="large"
            color="primary"
            onPress={() => submit({phoneCode, phoneNumber})}>
            <ButtonText>
              <Trans>Next</Trans>
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
      <P style={[style, a.font_medium]}>
        <Trans>How we use your number:</Trans>
      </P>
      <P style={style}>
        &bull; <Trans>Sent to a trusted third party for verification</Trans>
      </P>
      <P style={style}>
        &bull; <Trans>Deleted by the verifier after verification</Trans>
      </P>
      <P style={style}>
        &bull;{' '}
        <Trans>Held by Bluesky for 7 days to prevent abuse, then deleted</Trans>
      </P>
      <P style={style}>
        &bull;{' '}
        <Trans>Stored as part of a secret code for matching with others</Trans>
      </P>
      <P style={[style, a.mt_xs]}>
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
      </P>
    </View>
  )
}
