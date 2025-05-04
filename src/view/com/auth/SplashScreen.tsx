import {useEffect, useState} from 'react'
import {View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import * as SecureStore from 'expo-secure-store'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {isNative} from '#/platform/detection'
import {ErrorBoundary} from '#/view/com/util/ErrorBoundary'
import {Logo} from '#/view/icons/Logo'
import {Logotype} from '#/view/icons/Logotype'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {type RotationKey} from '#/screens/Settings/components/types'
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

  const [showKeyBackups, setShowKeyBackups] = useState(false)

  const fetchKeyBackups = async () => {
    let rotationKeysString =
      (await SecureStore.getItemAsync('rotationKeys')) ?? ''
    let rotationKeys: RotationKey[] = rotationKeysString
      ? JSON.parse(rotationKeysString)
      : []
    setShowKeyBackups(rotationKeys.length > 0)
  }

  useEffect(() => {
    if (isNative) {
      fetchKeyBackups()
    }
  }, [])

  return (
    <CenteredView style={[a.h_full, a.flex_1]}>
      <ErrorBoundary>
        <View style={[{flex: 1}, a.justify_center, a.align_center]}>
          <Logo width={92} fill="sky" />

          <View style={[a.pb_sm, a.pt_5xl]}>
            <Logotype width={161} fill={t.atoms.text.color} />
          </View>

          <Text style={[a.text_md, a.font_bold, t.atoms.text_contrast_medium]}>
            <Trans>What's up?</Trans>
          </Text>
        </View>

        {showKeyBackups && (
          <View style={[a.mt_md, a.mb_md]}>
            <SettingsList.LinkItem
              to="/settings/key-backups"
              label={_(msg`Key backups`)}>
              <SettingsList.ItemText>
                <Trans>Key backups</Trans>
              </SettingsList.ItemText>
            </SettingsList.LinkItem>
          </View>
        )}
        <View
          testID="signinOrCreateAccount"
          style={[a.px_xl, a.gap_md, a.pb_2xl]}>
          <Button
            testID="createAccountButton"
            onPress={onPressCreateAccount}
            label={_(msg`Create new account`)}
            accessibilityHint={_(
              msg`Opens flow to create a new Bluesky account`,
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
              msg`Opens flow to sign in to your existing Bluesky account`,
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
          <AppLanguageDropdown />
        </View>
        <View style={{height: insets.bottom}} />
      </ErrorBoundary>
    </CenteredView>
  )
}
