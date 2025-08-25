import {useState} from 'react'
import {View} from 'react-native'
import {KeyboardAvoidingView} from 'react-native-keyboard-controller'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useEnableKeyboardControllerScreen} from '#/lib/hooks/useEnableKeyboardController'
import {
  type AuthNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {Logo} from '#/view/icons/Logo'
import {atoms as a, native, platform, tokens} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as TextField from '#/components/forms/TextField'
import {Envelope_Stroke2_Corner0_Rounded as EnvelopeIcon} from '#/components/icons/Envelope'
import {Policies} from '../Signup/StepInfo/Policies'
import * as Layout from './components/Layout'

type Props = NativeStackScreenProps<AuthNavigatorParams, 'SignUpInfo'>
export function SignUpInfoScreen({}: Props) {
  return <SignUpInfoScreenInner />
}

export function SignUpInfoScreenInner() {
  const {_} = useLingui()
  const [email, setEmail] = useState('')

  const {bottom} = useSafeAreaInsets()

  useEnableKeyboardControllerScreen(true)

  return (
    <Layout.Screen testID="SignUpInfoScreen">
      <Layout.Header.Outer noBottomBorder>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Logo />
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <KeyboardAvoidingView
        style={[a.flex_1]}
        behavior="padding"
        keyboardVerticalOffset={Math.min(
          0,
          tokens.space._2xl -
            (bottom +
              platform({
                ios: tokens.space.xs,
                android: tokens.space.sm,
                default: 0,
              })),
        )}>
        <Layout.Content
          style={[a.flex_1]}
          contentContainerStyle={[a.px_2xl, a.py_lg]}>
          <Layout.TitleText>
            <Trans>Email</Trans>
          </Layout.TitleText>
          <View style={[a.mt_lg]}>
            <TextField.Root>
              <TextField.Icon icon={EnvelopeIcon} />
              <TextField.Input
                testID="emailInput"
                value={email}
                onChangeText={value => {
                  // emailValueRef.current = value.trim()
                  // if (hasWarnedEmail) {
                  //   setHasWarnedEmail(false)
                  // }
                  // if (
                  //   state.errorField === 'email' &&
                  //   value.trim().length > 0 &&
                  //   EmailValidator.validate(value.trim())
                  // ) {
                  //   dispatch({type: 'clearError'})
                  // }
                  setEmail(value)
                }}
                label={_(msg`name@email.com`)}
                autoFocus
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                returnKeyType="next"
                submitBehavior={native('submit')}
                onSubmitEditing={
                  // TODO
                  () => console.log('submit')
                }
              />
            </TextField.Root>
          </View>
        </Layout.Content>
        <View
          style={[
            a.px_2xl,
            {
              paddingBottom: Math.max(
                tokens.space._2xl,
                bottom +
                  platform({
                    ios: tokens.space.xs,
                    android: tokens.space.sm,
                    default: 0,
                  }),
              ),
            },
            a.gap_md,
          ]}>
          <Policies
            serviceDescription={{
              availableUserDomains: ['bsky.social'],
              did: 'did:plc:example',
              links: {
                privacyPolicy: 'https://example.com/pp',
                termsOfService: 'https://example.com/terms',
              },
            }}
            needsGuardian={true}
            under13={false}
            // needsGuardian={!is18(state.dateOfBirth)}
            // under13={!is13(state.dateOfBirth)}
          />
          <Button
            testID="emailNextButton"
            label={_(msg`Continue`)}
            accessibilityHint={_(msg`Go to the next step`)}
            variant="solid"
            color="primary"
            size="large">
            <ButtonText>
              <Trans>Continue</Trans>
            </ButtonText>
            {/* {isProcessing && <ButtonIcon icon={Loader} />} */}
          </Button>
        </View>
      </KeyboardAvoidingView>
    </Layout.Screen>
  )
}
