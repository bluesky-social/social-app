import React from 'react'
import {View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useFocusEffect} from '@react-navigation/native'

import {useAccountSwitcher} from '#/lib/hooks/useAccountSwitcher'
import {isWeb} from '#/platform/detection'
import {type SessionAccount, useSession, useSessionApi} from '#/state/session'
import {useSetMinimalShellMode} from '#/state/shell'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import {ScrollView} from '#/view/com/util/Views'
import {Logo} from '#/view/icons/Logo'
import {atoms as a, useTheme} from '#/alf'
import {AccountList} from '#/components/AccountList'
import {Button, ButtonText} from '#/components/Button'
import {Divider} from '#/components/Divider'
import {Text} from '#/components/Typography'

const COL_WIDTH = 400

export function Deactivated() {
  const {_} = useLingui()
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const {currentAccount, accounts} = useSession()
  const {onPressSwitchAccount, pendingDid} = useAccountSwitcher()
  const {setShowLoggedOut} = useLoggedOutViewControls()
  const hasOtherAccounts = accounts.length > 1
  const setMinimalShellMode = useSetMinimalShellMode()
  const {logout} = useSessionApi()

  useFocusEffect(
    React.useCallback(() => {
      setMinimalShellMode(true)
    }, [setMinimalShellMode]),
  )

  const onSelectAccount = React.useCallback(
    (account: SessionAccount) => {
      if (account.did !== currentAccount?.did) {
        onPressSwitchAccount(account, 'SwitchAccount')
      }
    },
    [currentAccount, onPressSwitchAccount],
  )

  const onPressAddAccount = React.useCallback(() => {
    setShowLoggedOut(true)
  }, [setShowLoggedOut])

  const onPressLogout = React.useCallback(() => {
    if (isWeb) {
      // We're switching accounts, which remounts the entire app.
      // On mobile, this gets us Home, but on the web we also need reset the URL.
      // We can't change the URL via a navigate() call because the navigator
      // itself is about to unmount, and it calls pushState() too late.
      // So we change the URL ourselves. The navigator will pick it up on remount.
      history.pushState(null, '', '/')
    }
    logout('Deactivated')
  }, [logout])

  return (
    <View style={[a.h_full_vh, a.flex_1, t.atoms.bg]}>
      <ScrollView
        style={[a.h_full, a.w_full]}
        contentContainerStyle={{borderWidth: 0}}>
        <View
          style={[
            a.px_2xl,
            {
              paddingTop: isWeb ? 64 : insets.top,
              paddingBottom: isWeb ? 64 : insets.bottom,
            },
          ]}>
          <View style={[a.flex_row, a.justify_center]}>
            <View style={[a.w_full, {maxWidth: COL_WIDTH}]}>
              <View
                style={[a.w_full, a.justify_center, a.align_center, a.pb_5xl]}>
                <Logo width={40} />
              </View>

              <View style={[a.gap_xs, a.pb_3xl]}>
                <Text style={[a.text_xl, a.font_bold, a.leading_snug]}>
                  <Trans>Welcome back!</Trans>
                </Text>
                <Text style={[a.text_sm, a.leading_snug]}>
                  <Trans>
                    You previously deactivated @{currentAccount?.handle}.
                  </Trans>
                </Text>
                <Text style={[a.text_sm, a.leading_snug, a.pb_md]}>
                  <Trans>
                    You can reactivate your account to continue logging in. Your
                    profile and posts will be visible to other users.
                  </Trans>
                </Text>

                <View style={[a.gap_sm]}>
                  <Button
                    label={_(msg`Reactivate your account`)}
                    size="medium"
                    variant="solid"
                    color="primary"
                    onPress={() => setShowLoggedOut(true)}>
                    <ButtonText>
                      <Trans>Yes, reactivate my account</Trans>
                    </ButtonText>
                  </Button>
                  <Button
                    label={_(msg`Cancel reactivation and log out`)}
                    size="medium"
                    variant="solid"
                    color="secondary"
                    onPress={onPressLogout}>
                    <ButtonText>
                      <Trans>Cancel</Trans>
                    </ButtonText>
                  </Button>
                </View>
              </View>

              <View style={[a.pb_3xl]}>
                <Divider />
              </View>

              {hasOtherAccounts ? (
                <>
                  <Text
                    style={[
                      t.atoms.text_contrast_medium,
                      a.pb_md,
                      a.leading_snug,
                    ]}>
                    <Trans>Or, log into one of your other accounts.</Trans>
                  </Text>
                  <AccountList
                    onSelectAccount={onSelectAccount}
                    onSelectOther={onPressAddAccount}
                    otherLabel={_(msg`Add account`)}
                    pendingDid={pendingDid}
                  />
                </>
              ) : (
                <>
                  <Text
                    style={[
                      t.atoms.text_contrast_medium,
                      a.pb_md,
                      a.leading_snug,
                    ]}>
                    <Trans>Or, continue with another account.</Trans>
                  </Text>
                  <Button
                    label={_(msg`Log in or sign up`)}
                    size="medium"
                    variant="solid"
                    color="secondary"
                    onPress={() => setShowLoggedOut(true)}>
                    <ButtonText>
                      <Trans>Log in or sign up</Trans>
                    </ButtonText>
                  </Button>
                </>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
