import {View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {ErrorBoundary} from '#/view/com/util/ErrorBoundary'
import {Logo} from '#/view/icons/Logo'
import {Logotype} from '#/view/icons/Logotype'
import {atoms as a, useTheme} from '#/alf'
import {AppLanguageDropdown} from '#/components/AppLanguageDropdown'
import {Button, ButtonText} from '#/components/Button'
import {Text} from '#/components/Typography'
import {CenteredView} from '../util/Views'

export const SplashScreen = ({
  onPressSignin,
  onPressCreateAccount,
}: {
  onPressSignin: () => void
  onPressCreateAccount: () => void
}) => {
  const t = useTheme()
  const {_} = useLingui()

  const insets = useSafeAreaInsets()

  return (
    <CenteredView style={[a.h_full, a.flex_1]}>
      <ErrorBoundary>
        <View
          style={[{flex: 1}, a.justify_center, a.align_center, a.pb_0, a.mb_0]}>
          <Logo width={120} fill={t.atoms.text.color} />

          <View style={[a.pb_sm, a.pt_5xl, a.mt_lg, a.mb_lg]}>
            <Logotype width={280} fill={t.atoms.text.color} />
          </View>

          <Text style={[a.text_md, a.font_bold, t.atoms.text_contrast_medium]}>
            <Trans>What's poppin'?</Trans>
          </Text>
        </View>
        <View
          testID="signinOrCreateAccount"
          style={[a.px_xl, a.gap_md, a.pb_2xl]}>
          <Button
            testID="createAccountButton"
            onPress={onPressCreateAccount}
            label={_(msg`Create new account`)}
            accessibilityHint={_(
              msg`Opens flow to create a new Blacksky account`,
            )}
            size="large"
            variant="solid"
            color="primary">
            <ButtonText>
              <Trans>Create account</Trans>
            </ButtonText>
          </Button>
          <Button
            testID="signInButton"
            onPress={onPressSignin}
            label={_(msg`Sign in`)}
            accessibilityHint={_(
              msg`Opens flow to sign in to your existing Blacksky account`,
            )}
            size="large"
            variant="solid"
            color="secondary">
            <ButtonText>
              <Trans>Sign in</Trans>
            </ButtonText>
          </Button>
        </View>
        <View
          style={[
            a.px_lg,
            a.pt_md,
            a.pb_2xl,
            a.justify_center,
            a.align_center,
          ]}>
          <View>
            <AppLanguageDropdown />
          </View>
        </View>
        <View style={{height: insets.bottom}} />
      </ErrorBoundary>
    </CenteredView>
  )
}
