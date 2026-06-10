import {useCallback} from 'react'
import {View} from 'react-native'
import {Image} from 'expo-image'
import {Trans, useLingui} from '@lingui/react/macro'

import {useCallOnce} from '#/lib/once'
import {Nux} from '#/state/queries/nuxs'
import {atoms as a, useTheme, web} from '#/alf'
import {themes} from '#/alf/themes'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {useNuxDialogContext} from '#/components/dialogs/nuxs'
import {Sparkle_Stroke2_Corner0_Rounded as SparkleIcon} from '#/components/icons/Sparkle'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {IS_E2E, IS_NATIVE, IS_WEB} from '#/env'
import {InviteFriendsDialog} from '#/features/inviteFriends'
import {createIsEnabledCheck} from './utils'

export const enabled = createIsEnabledCheck(() => {
  // Native-only feature (matches the rest of the invite-friends scope).
  // Skipped in E2E to keep tests deterministic.
  return !IS_E2E && IS_NATIVE
})

export function InviteFriendsAnnouncement() {
  const {activeNux} = useNuxDialogContext()
  /*
   * The invite dialog's control lives here (outside the activeNux
   * conditional) so the dialog survives the announcement being dismissed
   * during the "Try it" handoff - the native bottom sheet cannot hand off to
   * a second sheet that unmounts along with the first.
   */
  const inviteFriendsControl = Dialog.useDialogControl()

  return (
    <>
      {activeNux === Nux.InviteFriendsAnnouncement && (
        <Announcement inviteFriendsControl={inviteFriendsControl} />
      )}
      <InviteFriendsDialog control={inviteFriendsControl} />
    </>
  )
}

function Announcement({
  inviteFriendsControl,
}: {
  inviteFriendsControl: Dialog.DialogControlProps
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const ax = useAnalytics()
  const nuxDialogs = useNuxDialogContext()
  const control = Dialog.useDialogControl()

  Dialog.useAutoOpen(control)

  useCallOnce(() => {
    ax.metric('invite:nux:presented', {})
  })()

  const onClose = useCallback(() => {
    nuxDialogs.dismissActiveNux()
  }, [nuxDialogs])

  const onPressTryIt = useCallback(() => {
    ax.metric('invite:nux:tryItPressed', {})
    // Close this announcement (which dismisses the NUX and unmounts this
    // component), then open the invite dialog. Its control lives in the
    // parent, which stays mounted, so the dialog survives the dismissal.
    // Defer the open to the next frame so the announcement's teardown
    // completes first.
    control.close(() => {
      requestAnimationFrame(() => {
        ax.metric('invite:dialog:open', {logContext: 'NuxAnnouncement'})
        inviteFriendsControl.open()
      })
    })
  }, [ax, control, inviteFriendsControl])

  return (
    <>
      <Dialog.Outer
        control={control}
        onClose={onClose}
        nativeOptions={{preventExpansion: true}}>
        <Dialog.Handle fill={t.palette.primary_400} />

        <Dialog.ScrollableInner
          label={l`Invite your friends`}
          style={[web({maxWidth: 440})]}
          contentContainerStyle={[
            {paddingTop: 0, paddingLeft: 0, paddingRight: 0},
          ]}>
          <View
            style={[
              a.w_full,
              a.relative,
              a.overflow_hidden,
              {
                borderTopLeftRadius: a.rounded_md.borderRadius,
                borderTopRightRadius: a.rounded_md.borderRadius,
              },
            ]}>
            {/* The image is the full header background; the tag sits on top of it. */}
            <Image
              accessibilityIgnoresInvertColors
              source={require('../../../../assets/images/invite_friends_announcement_nux.webp')}
              style={[a.w_full, {aspectRatio: 754 / 440}]}
              alt={l`An illustration of the Bluesky app with a paper airplane flying out of it, representing inviting friends`}
            />
            <View
              style={[
                a.absolute,
                a.align_center,
                {top: 0, left: 0, right: 0, paddingTop: IS_WEB ? 24 : 20},
              ]}>
              {/* Pinned to the light palette: the header illustration has a
                  fixed light background, so the tag must stay dark in any
                  theme to remain legible. */}
              <View style={[a.flex_row, a.align_center, a.gap_xs]}>
                <SparkleIcon fill={themes.lightPalette.primary_800} size="sm" />
                <Text
                  style={[
                    a.font_semi_bold,
                    {color: themes.lightPalette.primary_800},
                  ]}>
                  <Trans>New Feature</Trans>
                </Text>
              </View>
            </View>
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
                  label={l`Try it`}
                  size="large"
                  color="primary"
                  onPress={onPressTryIt}
                  style={[a.w_full]}>
                  <ButtonText>
                    <Trans>Try it</Trans>
                  </ButtonText>
                </Button>
                <Button
                  label={l`Cancel`}
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
    </>
  )
}
