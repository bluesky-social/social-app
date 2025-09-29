import {useCallback} from 'react'
import {View} from 'react-native'
import {Image} from 'expo-image'
import {LinearGradient} from 'expo-linear-gradient'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {isWeb} from '#/platform/detection'
import {atoms as a, useTheme, web} from '#/alf'
import {transparentifyColor} from '#/alf/util/colorGeneration'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {useNuxDialogContext} from '#/components/dialogs/nuxs'
import {Sparkle_Stroke2_Corner0_Rounded as SparkleIcon} from '#/components/icons/Sparkle'
import {Text} from '#/components/Typography'

export function BookmarksAnnouncement() {
  const t = useTheme()
  const {_} = useLingui()
  const nuxDialogs = useNuxDialogContext()
  const control = Dialog.useDialogControl()

  Dialog.useAutoOpen(control)

  const onClose = useCallback(() => {
    nuxDialogs.dismissActiveNux()
  }, [nuxDialogs])

  return (
    <Dialog.Outer
      control={control}
      onClose={onClose}
      nativeOptions={{preventExpansion: true}}>
      <Dialog.Handle />

      <Dialog.ScrollableInner
        label={_(msg`Introducing saved posts AKA bookmarks`)}
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
              paddingTop: isWeb ? 24 : 40,
              borderTopLeftRadius: a.rounded_md.borderRadius,
              borderTopRightRadius: a.rounded_md.borderRadius,
            },
          ]}>
          <LinearGradient
            colors={[t.palette.primary_25, t.palette.primary_100]}
            locations={[0, 1]}
            start={{x: 0, y: 0}}
            end={{x: 0, y: 1}}
            style={[a.absolute, a.inset_0]}
          />
          <View style={[a.flex_row, a.align_center, a.gap_xs]}>
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
                  aspectRatio: 333 / 104,
                },
                isWeb
                  ? [
                      {
                        boxShadow: `0px 10px 15px -3px ${transparentifyColor(t.palette.black, 0.2)}`,
                      },
                    ]
                  : [
                      t.atoms.shadow_md,
                      {
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
                source={require('../../../../assets/images/bookmarks_announcement_nux.webp')}
                style={[
                  a.w_full,
                  {
                    aspectRatio: 333 / 104,
                  },
                ]}
                alt={_(
                  msg({
                    message: `A screenshot of a post with a new button next to the share button that allows you to save the post to your bookmarks. The post is from @jcsalterego.bsky.social and reads "inventing a saturday that immediately follows monday".`,
                    comment:
                      'Contains a post that originally appeared in English. Consider translating the post text if it makes sense in your language, and noting that the post was translated from English.',
                  }),
                )}
              />
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
                {
                  fontSize: isWeb ? 28 : 32,
                  maxWidth: 300,
                },
              ]}>
              <Trans>Saved Posts</Trans>
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
                Finally! Keep track of posts that matter to you. Save them to
                revisit anytime.
              </Trans>
            </Text>
          </View>

          {!isWeb && (
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
