import {View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {
  type AuthNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {isNative} from '#/platform/detection'
import {type SessionAccount, useSession} from '#/state/session'
import {
  useLoggedOutView,
  useLoggedOutViewControls,
} from '#/state/shell/logged-out'
import {Logo} from '#/view/icons/Logo'
import {Logotype} from '#/view/icons/Logotype'
import {atoms as a, useTheme} from '#/alf'
import {AppLanguageDropdown} from '#/components/AppLanguageDropdown'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {TimesLarge_Stroke2_Corner0_Rounded as CloseIcon} from '#/components/icons/Times'
import {Text} from '#/components/Typography'
import * as Layout from './components/Layout'

type Props = NativeStackScreenProps<AuthNavigatorParams, 'Landing'>
export function LandingScreen({navigation}: Props) {
  return (
    <LandingScreenInner
      signUp={() => navigation.navigate('SignUpInfo')}
      selectAccount={() => navigation.navigate('SelectAccount')}
      signIn={account => navigation.navigate('SignIn', {account})}
    />
  )
}

export function LandingScreenInner({
  signUp,
  selectAccount,
  signIn,
}: {
  signUp: () => void
  selectAccount: () => void
  signIn: (account?: SessionAccount) => void
}) {
  const {_} = useLingui()
  const t = useTheme()
  const insets = useSafeAreaInsets()

  const {accounts} = useSession()
  const {showLoggedOut, requestedAccountSwitchTo} = useLoggedOutView()
  const {setShowLoggedOut} = useLoggedOutViewControls()
  const requestedAccount = accounts.find(
    acc => acc.did === requestedAccountSwitchTo,
  )

  return (
    <Layout.Screen
      testID="LandingScreen"
      style={{paddingBottom: insets.bottom}}>
      {isNative && showLoggedOut && (
        <Layout.Header.Outer noBottomBorder>
          <Layout.Header.Slot />
          <Layout.Header.Content />
          <Layout.Header.Slot>
            <Button
              label={_(msg`Close`)}
              onPress={() => setShowLoggedOut(false)}
              size="small"
              color="secondary_inverted"
              shape="round"
              variant="solid">
              <ButtonIcon icon={CloseIcon} />
            </Button>
          </Layout.Header.Slot>
        </Layout.Header.Outer>
      )}
      <View style={[a.flex_1, a.justify_center, a.align_center]}>
        <Logo width={92} fill="sky" />

        <View style={[a.pb_sm, a.pt_5xl]}>
          <Logotype width={161} fill={t.atoms.text.color} />
        </View>

        <Text style={[a.text_md, a.font_bold, t.atoms.text_contrast_medium]}>
          <Trans>What's up?</Trans>
        </Text>
      </View>
      <View
        testID="signinOrCreateAccount"
        style={[a.px_xl, a.gap_md, a.pb_2xl]}>
        <Button
          testID="createAccountButton"
          onPress={signUp}
          label={_(msg`Create new account`)}
          size="large"
          variant="solid"
          color="primary">
          <ButtonText>
            <Trans>Create account</Trans>
          </ButtonText>
        </Button>
        <Button
          testID="signInButton"
          onPress={() => {
            if (requestedAccount) {
              signIn(requestedAccount)
            } else if (accounts.length > 0) {
              selectAccount()
            } else {
              signIn()
            }
          }}
          label={_(msg`Sign in`)}
          size="large"
          variant="solid"
          color="secondary">
          <ButtonText>
            <Trans>Sign in</Trans>
          </ButtonText>
        </Button>
      </View>
      <View
        style={[a.px_lg, a.pt_md, a.pb_2xl, a.justify_center, a.align_center]}>
        <View>
          <AppLanguageDropdown />
        </View>
      </View>
    </Layout.Screen>
  )
}
