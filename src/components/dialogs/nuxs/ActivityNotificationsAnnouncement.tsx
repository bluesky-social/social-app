import {useCallback} from 'react'
import {View} from 'react-native'
import {Image} from 'expo-image'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {useNuxDialogContext} from '#/components/dialogs/nuxs'
import {Sparkle_Stroke2_Corner0_Rounded as SparkleIcon} from '#/components/icons/Sparkle'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'

export function ActivityNotificationsAnnouncement() {
  const t = useTheme()
  const {_} = useLingui()
  const {gtMobile} = useBreakpoints()
  const nuxDialogs = useNuxDialogContext()
  const control = Dialog.useDialogControl()

  Dialog.useAutoOpen(control)

  const onClose = useCallback(() => {
    nuxDialogs.dismissActiveNux()
  }, [nuxDialogs])

  return (
    <Dialog.Outer control={control} onClose={onClose}>
      <Dialog.Handle />

      <Dialog.ScrollableInner
        label={_(msg`You're now able to be notified when someone posts`)}
        style={[
          gtMobile ? {width: 'auto', maxWidth: 400, minWidth: 200} : a.w_full,
        ]}
        contentContainerStyle={[
          {
            paddingTop: 0,
            paddingLeft: 0,
            paddingRight: 0,
          },
        ]}>
        <View
          style={[
            a.align_center,
            a.overflow_hidden,
            t.atoms.bg_contrast_25,
            {
              gap: 24,
              paddingTop: 48,
            },
          ]}>
          <View
            style={[
              a.pl_sm,
              a.pr_md,
              a.py_sm,
              a.rounded_full,
              a.flex_row,
              a.align_center,
              a.gap_xs,
              {
                backgroundColor: t.palette.primary_100,
              },
            ]}>
            <SparkleIcon fill={t.palette.primary_800} size="sm" />
            <Text
              style={[
                a.font_bold,
                {
                  color: t.palette.primary_800,
                },
              ]}>
              <Trans>New Feature</Trans>
            </Text>
          </View>

          <View style={[a.relative]}>
            <View
              style={[
                a.absolute,
                t.atoms.bg_contrast_25,
                t.atoms.shadow_md,
                {
                  top: 5,
                  bottom: 0,
                  left: '15%',
                  right: '15%',
                  width: '70%',
                  borderTopLeftRadius: 40,
                  borderTopRightRadius: 40,
                },
              ]}
            />
            <Image
              accessibilityIgnoresInvertColors
              source={require('../../../../assets/images/activity_notifications_announcement.png')}
              style={[
                a.w_full,
                {
                  aspectRatio: 380 / 231,
                },
              ]}
              alt={_(
                msg`An illustration showing that Bluesky selects trusted verifiers, and trusted verifiers in turn verify individual user accounts.`,
              )}
            />
          </View>
        </View>
        <View style={[a.pt_4xl, a.p_xl, a.gap_5xl]}>
          <View style={[a.gap_sm]}>
            <Text style={[a.text_3xl, a.leading_tight, a.font_bold]}>
              <Trans>Get notified when someone posts</Trans>
            </Text>
            <Text style={[a.text_md, a.leading_snug]}>
              <Trans>
                You can now choose to receive notifications for when specific
                people make new posts. If there’s someone you want timely
                updates from, go to their profile and find the new bell icon
                near the follow button.
              </Trans>
            </Text>
            <Text style={[a.text_md, a.leading_snug]}>
              <Trans>
                By default, only people you follow can subscribe to you. You can
                change this in Settings.
              </Trans>
            </Text>
          </View>

          <View style={[a.gap_md]}>
            <Button
              label={_(msg`Close`)}
              size="large"
              variant="solid"
              color="primary"
              onPress={() => {
                control.close()
              }}>
              <ButtonText>
                <Trans>Close</Trans>
              </ButtonText>
            </Button>
            <Link
              to={{screen: 'NotificationSettings'}}
              label={_(msg`Edit who can subscribe`)}
              size="large"
              variant="solid"
              color="secondary"
              style={[a.justify_center]}
              onPress={() => {
                control.close()
              }}>
              <ButtonText>
                <Trans>Edit who can subscribe</Trans>
              </ButtonText>
            </Link>
          </View>
        </View>

        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}
