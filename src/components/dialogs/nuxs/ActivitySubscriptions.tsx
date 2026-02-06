import {useCallback} from 'react'
import {View} from 'react-native'
import {Image} from 'expo-image'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, useTheme, web} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {useNuxDialogContext} from '#/components/dialogs/nuxs'
import {Sparkle_Stroke2_Corner0_Rounded as SparkleIcon} from '#/components/icons/Sparkle'
import {Text} from '#/components/Typography'
import {IS_WEB} from '#/env'

export function ActivitySubscriptionsNUX() {
  const t = useTheme()
  const {_} = useLingui()
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
        label={_(msg`Introducing activity notifications`)}
        style={[web({maxWidth: 400})]}
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
              gap: IS_WEB ? 16 : 24,
              paddingTop: IS_WEB ? 24 : 48,
              borderTopLeftRadius: a.rounded_md.borderRadius,
              borderTopRightRadius: a.rounded_md.borderRadius,
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
                a.font_semi_bold,
                {
                  color: t.palette.primary_800,
                },
              ]}>
              <Trans>New Feature</Trans>
            </Text>
          </View>

          <View style={[a.relative, a.w_full]}>
            <View
              style={[
                a.absolute,
                t.atoms.bg_contrast_25,
                t.atoms.shadow_md,
                {
                  shadowOpacity: 0.4,
                  top: 5,
                  bottom: 0,
                  left: '17%',
                  right: '17%',
                  width: '66%',
                  borderTopLeftRadius: 40,
                  borderTopRightRadius: 40,
                },
              ]}
            />
            <View
              style={[
                a.overflow_hidden,
                {
                  aspectRatio: 398 / 228,
                },
              ]}>
              <Image
                accessibilityIgnoresInvertColors
                source={require('../../../../assets/images/activity_notifications_announcement.webp')}
                style={[
                  a.w_full,
                  {
                    aspectRatio: 398 / 268,
                  },
                ]}
                alt={_(
                  msg`A screenshot of a profile page with a bell icon next to the follow button, indicating the new activity notifications feature.`,
                )}
              />
            </View>
          </View>
        </View>
        <View
          style={[
            a.align_center,
            a.px_xl,
            IS_WEB ? [a.pt_xl, a.gap_xl, a.pb_sm] : [a.pt_3xl, a.gap_3xl],
          ]}>
          <View style={[a.gap_md, a.align_center]}>
            <Text
              style={[
                a.text_3xl,
                a.leading_tight,
                a.font_bold,
                a.text_center,
                {
                  fontSize: IS_WEB ? 28 : 32,
                  maxWidth: 300,
                },
              ]}>
              <Trans>Get notified when someone posts</Trans>
            </Text>
            <Text
              style={[
                a.text_md,
                a.leading_snug,
                a.text_center,
                {
                  maxWidth: 340,
                },
              ]}>
              <Trans>
                You can now choose to be notified when specific people post. If
                there’s someone you want timely updates from, go to their
                profile and find the new bell icon near the follow button.
              </Trans>
            </Text>
          </View>

          {!IS_WEB && (
            <Button
              label={_(msg`Close`)}
              size="large"
              variant="solid"
              color="primary"
              onPress={() => {
                control.close()
              }}
              style={[a.w_full, {maxWidth: 280}]}>
              <ButtonText>
                <Trans>Close</Trans>
              </ButtonText>
            </Button>
          )}
        </View>

        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}
