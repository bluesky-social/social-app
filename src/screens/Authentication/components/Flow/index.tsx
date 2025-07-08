import {useReducer} from 'react'
import {View} from 'react-native'
import {ImageBackground} from 'expo-image'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {type SessionAccount} from '#/state/session'
import {Logo} from '#/view/icons/Logo'
import {Logotype} from '#/view/icons/Logotype'
import {atoms as a, tokens, useTheme, web} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {TimesLarge_Stroke2_Corner0_Rounded as XIcon} from '#/components/icons/Times'
import {ForgotPasswordScreenInner} from '../../ForgotPasswordScreen'
import {LandingScreenInner} from '../../LandingScreen'
import {PasswordUpdatedScreenInner} from '../../PasswordUpdatedScreen'
import {SelectAccountScreenInner} from '../../SelectAccountScreen'
import {SetNewPasswordScreenInner} from '../../SetNewPasswordScreen'
import {SignInScreenInner} from '../../SignInScreen'
import {SignUpCaptchaScreenInner} from '../../SignUpCaptchaScreen'
import {SignUpHandleScreenInner} from '../../SignUpHandleScreen'
import {SignUpInfoScreenInner} from '../../SignUpInfoScreen'
import {StarterPackLandingScreenInner} from '../../StarterPackLandingScreen'

type State =
  | {
      screen: 'Landing'
    }
  | {
      screen: 'ForgotPassword'
    }
  | {
      screen: 'PasswordUpdated'
    }
  | {
      screen: 'SelectAccount'
    }
  | {
      screen: 'SetNewPassword'
    }
  | {
      screen: 'SignIn'
      requestedAccount?: SessionAccount
    }
  | {
      screen: 'SignUpCaptcha'
    }
  | {
      screen: 'SignUpHandle'
    }
  | {
      screen: 'SignUpInfo'
    }
  | {
      screen: 'StarterPackLanding'
    }

type Action =
  | {
      type: 'NAVIGATE_TO_SIGN_IN'
      account?: SessionAccount
    }
  | {
      type: 'NAVIGATE_TO_SIGN_UP'
    }
  | {
      type: 'NAVIGATE_TO_SELECT_ACCOUNT'
    }
  | {
      type: 'NAVIGATE_TO_FORGOT_PASSWORD'
    }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'NAVIGATE_TO_SIGN_IN':
      return {screen: 'SignIn', requestedAccount: action.account}
    case 'NAVIGATE_TO_SIGN_UP':
      return {screen: 'SignUpHandle'}
    case 'NAVIGATE_TO_SELECT_ACCOUNT':
      return {screen: 'SelectAccount'}
    case 'NAVIGATE_TO_FORGOT_PASSWORD':
      return {screen: 'ForgotPassword'}
    default:
      // @ts-expect-error this will stop throwing an error if we miss a case
      throw new Error(`Unhandled action type: ${action.type}`)
  }
}

export function AuthenticationFlow({onDismiss}: {onDismiss?: () => void}) {
  const [state, dispatch] = useReducer(reducer, {screen: 'Landing'})

  let content
  switch (state.screen) {
    case 'ForgotPassword':
      content = <ForgotPasswordScreenInner />
      break
    case 'Landing':
      content = (
        <LandingScreenInner
          signIn={account => dispatch({type: 'NAVIGATE_TO_SIGN_IN', account})}
          selectAccount={() => dispatch({type: 'NAVIGATE_TO_SELECT_ACCOUNT'})}
          signUp={() => dispatch({type: 'NAVIGATE_TO_SIGN_UP'})}
        />
      )
      break
    case 'PasswordUpdated':
      content = <PasswordUpdatedScreenInner />
      break
    case 'SelectAccount':
      content = (
        <SelectAccountScreenInner
          signIn={account => dispatch({type: 'NAVIGATE_TO_SIGN_IN', account})}
        />
      )
      break
    case 'SetNewPassword':
      content = <SetNewPasswordScreenInner />
      break
    case 'SignIn':
      content = (
        <SignInScreenInner
          requestedAccount={state.requestedAccount}
          signUp={() => dispatch({type: 'NAVIGATE_TO_SIGN_UP'})}
          forgotPassword={() => dispatch({type: 'NAVIGATE_TO_FORGOT_PASSWORD'})}
        />
      )
      break
    case 'SignUpCaptcha':
      content = <SignUpCaptchaScreenInner />
      break
    case 'SignUpHandle':
      content = <SignUpHandleScreenInner />
      break
    case 'SignUpInfo':
      content = <SignUpInfoScreenInner />
      break
    case 'StarterPackLanding':
      content = <StarterPackLandingScreenInner />
      break
  }

  return <Shell onDismiss={onDismiss}>{content}</Shell>
}

function Shell({
  children,
  onDismiss,
}: {
  children?: React.ReactNode
  onDismiss?: () => void
}) {
  const t = useTheme()
  const {_} = useLingui()

  const image =
    t.scheme === 'light'
      ? require('../../../../../assets/background-light.webp')
      : require('../../../../../assets/background-dark.webp')

  return (
    <ImageBackground
      style={[
        a.w_full,
        a.h_full,
        web({minHeight: '100vh'}),
        a.align_center,
        a.justify_center,
        a.gap_md,
        a.px_md,
      ]}
      source={image}>
      {onDismiss && (
        <Button
          label={_(msg`Close`)}
          onPress={onDismiss}
          variant="solid"
          color="secondary_inverted"
          shape="round"
          size="small"
          style={[a.absolute, {top: tokens.space.xl, right: tokens.space.xl}]}>
          <ButtonIcon icon={XIcon} />
        </Button>
      )}
      <View
        style={[a.px_lg, a.justify_center, a.align_center, {height: '20%'}]}>
        <View style={[a.align_end, a.flex_row, a.gap_xl]}>
          <Logo fill="white" width={65} />
          <Logotype fill="white" width={180} />
        </View>
      </View>
      <View
        style={[
          a.rounded_lg,
          t.atoms.bg,
          web({height: 440, maxHeight: 'calc(60% - 32px)'}),
          a.w_full,
          {maxWidth: 480},
          a.overflow_auto,
        ]}>
        {children}
      </View>
    </ImageBackground>
  )
}
