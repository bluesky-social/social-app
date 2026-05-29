import {useCallback, useState} from 'react'
import {View} from 'react-native'
import {LinearGradient} from 'expo-linear-gradient'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {atoms as a, useTheme, web} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {useNuxDialogContext} from '#/components/dialogs/nuxs'
import {Sparkle_Stroke2_Corner0_Rounded as SparkleIcon} from '#/components/icons/Sparkle'
import {Text} from '#/components/Typography'
import {IS_E2E, IS_NATIVE, IS_WEB} from '#/env'
import {InviteFriendsDialog} from '#/features/inviteFriends'
import {createIsEnabledCheck} from './utils'

export const enabled = createIsEnabledCheck(() => {
  // Native-only feature (matches the rest of the invite-friends scope).
  // Skipped in E2E to keep tests deterministic.
  return !IS_E2E && IS_NATIVE
})

export function InviteFriendsAnnouncement() {
  const t = useTheme()
  const {_} = useLingui()
  const nuxDialogs = useNuxDialogContext()
  const control = Dialog.useDialogControl()
  const inviteFriendsControl = Dialog.useDialogControl()
  const [openInviteAfterClose, setOpenInviteAfterClose] = useState(false)

  Dialog.useAutoOpen(control)

  const onClose = useCallback(() => {
    nuxDialogs.dismissActiveNux()
    if (openInviteAfterClose) {
      // Defer to the next tick so the close animation completes before
      // we open the next dialog (avoids visual glitch on iOS).
      setOpenInviteAfterClose(false)
      inviteFriendsControl.open()
    }
  }, [nuxDialogs, openInviteAfterClose, inviteFriendsControl])

  const onPressTryIt = useCallback(() => {
    setOpenInviteAfterClose(true)
    control.close()
  }, [control])

  return (
    <>
      <Dialog.Outer
        control={control}
        onClose={onClose}
        nativeOptions={{preventExpansion: true}}>
        <Dialog.Handle fill={t.palette.primary_400} />

        <Dialog.ScrollableInner
          label={_(msg`Invite your friends`)}
          style={[web({maxWidth: 440})]}
          contentContainerStyle={[
            {paddingTop: 0, paddingLeft: 0, paddingRight: 0},
          ]}>
          <View
            style={[
              a.align_center,
              a.overflow_hidden,
              {
                paddingTop: IS_WEB ? 24 : 40,
                paddingBottom: 16,
                borderTopLeftRadius: a.rounded_md.borderRadius,
                borderTopRightRadius: a.rounded_md.borderRadius,
              },
            ]}>
            <LinearGradient
              colors={[t.palette.primary_100, t.palette.primary_200]}
              locations={[0, 1]}
              start={{x: 0, y: 0}}
              end={{x: 0, y: 1}}
              style={[a.absolute, a.inset_0]}
            />
            <View style={[a.flex_row, a.align_center, a.gap_xs]}>
              <SparkleIcon fill={t.palette.primary_800} size="sm" />
              <Text style={[a.font_semi_bold, {color: t.palette.primary_800}]}>
                <Trans>New Feature</Trans>
              </Text>
            </View>
            {/*
              TODO: drop promo image
            */}
            <View
              style={{
                width: 220,
                height: 140,
                marginTop: 12,
              }}
            />
          </View>
          <View style={[a.align_center, a.px_xl, a.pt_xl, a.gap_2xl, a.pb_sm]}>
            <View style={[a.gap_sm, a.align_center]}>
              <Text
                style={[
                  a.text_3xl,
                  a.leading_tight,
                  a.font_bold,
                  a.text_center,
                  {fontSize: IS_WEB ? 28 : 32, maxWidth: 300},
                ]}>
                <Trans>Invite your friends</Trans>
              </Text>
              <Text
                style={[
                  a.text_md,
                  a.leading_snug,
                  a.text_center,
                  t.atoms.text_contrast_medium,
                  {maxWidth: 340},
                ]}>
                <Trans>
                  You can now invite friends with a link or QR code. Share it
                  anywhere or let them scan to join you on Bluesky.
                </Trans>
              </Text>
            </View>

            {!IS_WEB && (
              <View style={[a.w_full, a.gap_sm]}>
                <Button
                  label={_(msg`Try it`)}
                  size="large"
                  color="primary"
                  onPress={onPressTryIt}
                  style={[a.w_full]}>
                  <ButtonText>
                    <Trans>Try it</Trans>
                  </ButtonText>
                </Button>
                <Button
                  label={_(msg`Cancel`)}
                  size="large"
                  color="secondary"
                  onPress={() => control.close()}
                  style={[a.w_full]}>
                  <ButtonText>
                    <Trans>Cancel</Trans>
                  </ButtonText>
                </Button>
              </View>
            )}
          </View>

          <Dialog.Close />
        </Dialog.ScrollableInner>
      </Dialog.Outer>

      <InviteFriendsDialog control={inviteFriendsControl} />
    </>
  )
}
