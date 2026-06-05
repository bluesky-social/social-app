import {useCallback, useEffect} from 'react'
import {View} from 'react-native'
import {Image} from 'expo-image'
import {Trans, useLingui} from '@lingui/react/macro'

import {atoms as a, useTheme, web} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {useNuxDialogContext} from '#/components/dialogs/nuxs'
import {Sparkle_Stroke2_Corner0_Rounded as SparkleIcon} from '#/components/icons/Sparkle'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {IS_E2E, IS_NATIVE, IS_WEB} from '#/env'
import {createIsEnabledCheck} from './utils'

export const enabled = createIsEnabledCheck(() => {
  // Native-only feature (matches the rest of the invite-friends scope).
  // Skipped in E2E to keep tests deterministic.
  return !IS_E2E && IS_NATIVE
})

export function InviteFriendsAnnouncement() {
  const t = useTheme()
  const {t: l} = useLingui()
  const ax = useAnalytics()
  const nuxDialogs = useNuxDialogContext()
  const control = Dialog.useDialogControl()

  Dialog.useAutoOpen(control)

  useEffect(() => {
    ax.metric('invite:nux:presented', {})
    // Fire once on mount - the NUX has a single lifecycle per session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onClose = useCallback(() => {
    nuxDialogs.dismissActiveNux()
  }, [nuxDialogs])

  const onPressTryIt = useCallback(() => {
    ax.metric('invite:nux:tryItPressed', {})
    // Close this announcement (which dismisses + unmounts the NUX), then open
    // the invite dialog. The invite dialog is mounted persistently by NuxDialogs
    // (not here) so it survives the dismissal - the native bottom sheet cannot
    // hand off to a second sheet mounted in this same subtree. Defer the open to
    // the next frame so the announcement's teardown completes first.
    control.close(() => {
      requestAnimationFrame(() => nuxDialogs.openInviteFriends())
    })
  }, [ax, control, nuxDialogs])

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
              <View style={[a.flex_row, a.align_center, a.gap_xs]}>
                <SparkleIcon fill={t.palette.primary_800} size="sm" />
                <Text
                  style={[a.font_semi_bold, {color: t.palette.primary_800}]}>
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
