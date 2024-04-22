import React, {useCallback} from 'react'
import {Linking, View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'

import {FEEDBACK_FORM_URL, HELP_DESK_URL} from '#/lib/constants'
import {useAccountSwitcher} from '#/lib/hooks/useAccountSwitcher'
import {useProfileQuery} from '#/state/queries/profile'
import {type SessionAccount, useSession, useSessionApi} from '#/state/session'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import {useCloseAllActiveElements} from '#/state/util'
import {NavigationProp} from 'lib/routes/types'
import {LoadingPlaceholder} from '#/view/com/util/LoadingPlaceholder'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme} from '#/alf'
import {AccountList} from '#/components/AccountList'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRight} from '#/components/icons/Chevron'
import {SettingsGear2_Stroke2_Corner0_Rounded as SettingsGear} from '#/components/icons/Gear'
import {ListSparkle_Stroke2_Corner0_Rounded as ListSparkle} from '#/components/icons/ListSparkle'
import {RaisingHande4Finger_Stroke2_Corner0_Rounded as RaisingHand} from '#/components/icons/RaisingHand'
import {SquareArrowTopRight_Stroke2_Corner0_Rounded as SquareArrowTopRight} from '#/components/icons/SquareArrowTopRight'
import {Text} from '#/components/Typography'
import {resetToTab} from '#/Navigation'

export function ProfileMenuDialog({
  control,
  onPressTab,
}: {
  control: Dialog.DialogControlProps
  onPressTab: (tab: 'MyProfile') => void
}) {
  const {_} = useLingui()
  const t = useTheme()
  const {currentAccount} = useSession()
  const {logout} = useSessionApi()
  const {onPressSwitchAccount} = useAccountSwitcher()
  const {setShowLoggedOut} = useLoggedOutViewControls()
  const navigation = useNavigation<NavigationProp>()
  const closeAllActiveElements = useCloseAllActiveElements()

  const onPressProfile = useCallback(() => {
    control.close()
    onPressTab('MyProfile')
  }, [control, onPressTab])

  const onPressLink = useCallback(
    (screen: 'Lists' | 'Moderation' | 'Settings') => {
      control.close()
      navigation.navigate(screen)
    },
    [control, navigation],
  )

  const onSelectAccount = useCallback(
    (account: SessionAccount) => {
      if (account.did === currentAccount?.did) {
        control.close()
      } else {
        onPressSwitchAccount(account, 'SwitchAccount')
      }
    },
    [currentAccount, control, onPressSwitchAccount],
  )

  const onPressAddAccount = useCallback(() => {
    setShowLoggedOut(true)
    closeAllActiveElements()
  }, [setShowLoggedOut, closeAllActiveElements])

  const onPressSignOut = useCallback(() => {
    logout('Settings')
    resetToTab('HomeTab')
    closeAllActiveElements()
  }, [logout, closeAllActiveElements])

  const onPressFeedback = React.useCallback(() => {
    Linking.openURL(
      FEEDBACK_FORM_URL({
        email: currentAccount?.email,
        handle: currentAccount?.handle,
      }),
    )
  }, [currentAccount])

  const onPressHelp = React.useCallback(() => {
    Linking.openURL(HELP_DESK_URL)
  }, [])

  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />

      <Dialog.ScrollableInner label={_(msg`App Menu`)}>
        <View style={[a.gap_sm]}>
          <ProfileCard onPress={onPressProfile} />

          <View style={[a.flex_row, a.gap_sm]}>
            <View style={[a.flex_1]}>
              <Button
                color="secondary"
                variant="solid"
                size="medium"
                label={_(msg`Lists`)}
                onPress={() => onPressLink('Lists')}
                style={[
                  t.atoms.border_contrast_low,
                  a.border,
                  a.justify_start,
                ]}>
                <ButtonIcon position="left" icon={ListSparkle} />
                <ButtonText numberOfLines={1}>
                  <Trans>Lists</Trans>
                </ButtonText>
              </Button>
            </View>
            <View style={[a.flex_1]}>
              <Button
                color="secondary"
                variant="solid"
                size="medium"
                label={_(msg`Moderation`)}
                onPress={() => onPressLink('Moderation')}
                style={[
                  t.atoms.border_contrast_low,
                  a.border,
                  a.justify_start,
                ]}>
                <ButtonIcon position="left" icon={RaisingHand} />
                <ButtonText numberOfLines={1}>
                  <Trans>Moderation</Trans>
                </ButtonText>
              </Button>
            </View>
          </View>

          <Button
            color="secondary"
            variant="solid"
            size="medium"
            label={_(msg`Settings`)}
            onPress={() => onPressLink('Settings')}
            style={[t.atoms.border_contrast_low, a.border, a.justify_start]}>
            <ButtonIcon position="left" icon={SettingsGear} />
            <ButtonText>
              <Trans>Settings</Trans>
            </ButtonText>
          </Button>

          <Text style={[a.font_bold, t.atoms.text, a.mt_sm]}>
            <Trans>Accounts</Trans>
          </Text>
          <AccountList
            onSelectAccount={onSelectAccount}
            onSelectOther={onPressAddAccount}
            otherLabel={_(msg`Add account`)}
            excludeCurrent
            style={[t.atoms.bg_contrast_25]}
          />

          <Button
            color="secondary"
            variant="solid"
            size="medium"
            label={_(msg`Sign Out`)}
            onPress={onPressSignOut}
            style={[t.atoms.border_contrast_low, a.border, a.justify_start]}>
            <ButtonIcon position="left" icon={SquareArrowTopRight} />
            <ButtonText>
              <Trans>Sign Out</Trans>
            </ButtonText>
          </Button>

          <View style={[a.flex_row, a.gap_sm]}>
            <View style={[a.flex_1]}>
              <Button
                color="secondary"
                variant="solid"
                size="medium"
                label={_(msg`Feedback`)}
                onPress={onPressFeedback}
                style={[
                  t.atoms.border_contrast_low,
                  a.border,
                  a.justify_start,
                ]}>
                <ButtonText numberOfLines={1}>
                  <Trans>Feedback</Trans>
                </ButtonText>
              </Button>
            </View>
            <View style={[a.flex_1]}>
              <Button
                color="secondary"
                variant="solid"
                size="medium"
                label={_(msg`Help`)}
                onPress={onPressHelp}
                style={[
                  t.atoms.border_contrast_low,
                  a.border,
                  a.justify_start,
                ]}>
                <ButtonText numberOfLines={1}>
                  <Trans>Help</Trans>
                </ButtonText>
              </Button>
            </View>
          </View>
        </View>
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

function ProfileCard({onPress}: {onPress: () => void}) {
  const t = useTheme()
  const {currentAccount} = useSession()
  const {isLoading, data: profile} = useProfileQuery({did: currentAccount!.did})
  const {_} = useLingui()
  const size = 48

  return (
    <View style={[a.mb_md]}>
      {!isLoading && profile ? (
        <Button label={_(msg`My Profile`)} onPress={onPress}>
          {() => (
            <View style={[a.flex_row, a.gap_md, a.align_center]}>
              <UserAvatar
                avatar={profile.avatar}
                size={size}
                type={profile?.associated?.labeler ? 'labeler' : 'user'}
              />
              <View style={[a.flex_1]}>
                <Text
                  style={[a.text_lg, a.font_bold, t.atoms.text]}
                  numberOfLines={1}>
                  {profile.displayName || profile.handle}
                </Text>
                <Text style={[t.atoms.text_contrast_medium]} numberOfLines={1}>
                  @{profile.handle}
                </Text>
              </View>
              <View>
                <ChevronRight fill={t.atoms.text_contrast_low.color} />
              </View>
            </View>
          )}
        </Button>
      ) : (
        <View>
          <LoadingPlaceholder
            width={size}
            height={size}
            style={{borderRadius: size}}
          />
        </View>
      )}
    </View>
  )
}
