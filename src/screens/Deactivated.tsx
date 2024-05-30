import React from 'react'
import {View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useFocusEffect} from '@react-navigation/native'

import {useAccountSwitcher} from '#/lib/hooks/useAccountSwitcher'
import {type SessionAccount, useSession} from '#/state/session'
import {useSetMinimalShellMode} from '#/state/shell'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import {ScrollView} from '#/view/com/util/Views'
import {Logo} from '#/view/icons/Logo'
import {atoms as a, useTheme} from '#/alf'
import {AccountList} from '#/components/AccountList'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {Divider} from '#/components/Divider'
import {ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as Refresh} from '#/components/icons/ArrowRotateCounterClockwise'
import {Person_Stroke2_Corner0_Rounded as Person} from '#/components/icons/Person'
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

  return (
    <View style={[a.h_full_vh, a.flex_1, t.atoms.bg]}>
      <ScrollView
        style={[a.h_full, a.w_full]}
        contentContainerStyle={{borderWidth: 0}}>
        <View
          style={[
            a.px_2xl,
            {
              paddingTop: insets.top + a.pt_5xl.paddingTop,
              paddingBottom: insets.bottom + a.pt_5xl.paddingTop,
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
                  <Trans>Hello!</Trans>
                </Text>
                <Text style={[a.text_md, a.leading_snug, a.pb_md]}>
                  <Trans>
                    You have deactivated your account, and can no longer access
                    Bluesky. To reactivate, click the button below.
                  </Trans>
                </Text>

                <Button
                  label={_(msg`Reactivate your account`)}
                  size="large"
                  variant="solid"
                  color="primary"
                  onPress={() => setShowLoggedOut(true)}>
                  <ButtonIcon icon={Refresh} position="left" />
                  <ButtonText>
                    <Trans>Reactivate account</Trans>
                  </ButtonText>
                </Button>
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
                    size="large"
                    variant="solid"
                    color="secondary"
                    onPress={() => setShowLoggedOut(true)}>
                    <ButtonIcon icon={Person} position="left" />
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
