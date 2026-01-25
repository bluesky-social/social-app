import {useCallback, useMemo} from 'react'
import {View} from 'react-native'
import {Image} from 'expo-image'
import {LinearGradient} from 'expo-linear-gradient'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, select, useTheme, utils, web} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {useNuxDialogContext} from '#/components/dialogs/nuxs'
import {
  createIsEnabledCheck,
  isExistingUserAsOf,
} from '#/components/dialogs/nuxs/utils'
import {Beaker_Stroke2_Corner2_Rounded as BeakerIcon} from '#/components/icons/Beaker'
import {Text} from '#/components/Typography'
import {IS_E2E, IS_WEB} from '#/env'

export const enabled = createIsEnabledCheck(props => {
  return (
    !IS_E2E &&
    isExistingUserAsOf(
      '2026-01-16T00:00:00.000Z',
      props.currentProfile.createdAt,
    ) &&
    !props.features.enabled(props.features.LiveNowBetaDisable)
  )
})

export function LiveNowBetaDialog() {
  const t = useTheme()
  const {_} = useLingui()
  const nuxDialogs = useNuxDialogContext()
  const control = Dialog.useDialogControl()

  Dialog.useAutoOpen(control)

  const onClose = useCallback(() => {
    nuxDialogs.dismissActiveNux()
  }, [nuxDialogs])

  const shadowColor = useMemo(() => {
    return select(t.name, {
      light: utils.alpha(t.palette.primary_900, 0.4),
      dark: utils.alpha(t.palette.primary_25, 0.4),
      dim: utils.alpha(t.palette.primary_25, 0.4),
    })
  }, [t])

  return (
    <Dialog.Outer
      control={control}
      onClose={onClose}
      nativeOptions={{preventExpansion: true}}>
      <Dialog.Handle fill={t.palette.primary_700} />

      <Dialog.ScrollableInner
        label={_(msg`Show when you’re live`)}
        style={[web({maxWidth: 440})]}
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
            {
              gap: 16,
              paddingTop: IS_WEB ? 24 : 40,
              borderTopLeftRadius: a.rounded_md.borderRadius,
              borderTopRightRadius: a.rounded_md.borderRadius,
            },
          ]}>
          <LinearGradient
            colors={[
              t.palette.primary_100,
              utils.alpha(t.palette.primary_100, 0),
            ]}
            locations={[0, 1]}
            start={{x: 0, y: 0}}
            end={{x: 0, y: 1}}
            style={[a.absolute, a.inset_0]}
          />
          <View style={[a.flex_row, a.align_center, a.gap_xs]}>
            <BeakerIcon fill={t.palette.primary_700} size="sm" />
            <Text
              style={[
                a.font_semi_bold,
                {
                  color: t.palette.primary_700,
                },
              ]}>
              <Trans>Beta Feature</Trans>
            </Text>
          </View>

          <View
            style={[
              a.relative,
              a.w_full,
              {
                paddingTop: 8,
                paddingHorizontal: 32,
                paddingBottom: 32,
              },
            ]}>
            <View
              style={[
                {
                  borderRadius: 24,
                  aspectRatio: 652 / 211,
                },
                IS_WEB
                  ? [
                      {
                        boxShadow: `0px 10px 15px -3px ${shadowColor}`,
                      },
                    ]
                  : [
                      t.atoms.shadow_md,
                      {
                        shadowColor,
                        shadowOpacity: 0.2,
                        shadowOffset: {
                          width: 0,
                          height: 10,
                        },
                      },
                    ],
              ]}>
              <Image
                accessibilityIgnoresInvertColors
                source={require('../../../../assets/images/live_now_beta.webp')}
                style={[
                  a.w_full,
                  {
                    aspectRatio: 652 / 211,
                  },
                ]}
                alt={_(
                  msg({
                    message: `A screenshot of a post from @esb.lol, showing the user is currently livestreaming content on Twitch. The post reads: "Hello! I'm live on Twitch, and I'm testing Bluesky's latest feature too!"`,
                    comment:
                      'Contains a post that originally appeared in English. Consider translating the post text if it makes sense in your language, and noting that the post was translated from English.',
                  }),
                )}
              />
            </View>
          </View>
        </View>
        <View style={[a.align_center, a.px_xl, a.gap_2xl, a.pb_sm]}>
          <View style={[a.gap_sm, a.align_center]}>
            <Text
              style={[
                a.text_3xl,
                a.leading_tight,
                a.font_bold,
                a.text_center,
                {
                  fontSize: IS_WEB ? 28 : 32,
                  maxWidth: 360,
                },
              ]}>
              <Trans>Show when you’re live</Trans>
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
                Streaming on Twitch? Set your live status on Bluesky to add a
                badge to your avatar. Tapping it takes people straight to your
                stream.
              </Trans>
            </Text>
          </View>

          {!IS_WEB && (
            <Button
              label={_(msg`Close`)}
              size="large"
              color="primary"
              onPress={() => {
                control.close()
              }}
              style={[a.w_full]}>
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
