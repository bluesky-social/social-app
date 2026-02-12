import {useCallback} from 'react'
import {View} from 'react-native'
import {Image} from 'expo-image'
import {LinearGradient} from 'expo-linear-gradient'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, useTheme, web} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {useNuxDialogContext} from '#/components/dialogs/nuxs'
import {Sparkle_Stroke2_Corner0_Rounded as SparkleIcon} from '#/components/icons/Sparkle'
import {Text} from '#/components/Typography'
import {IS_E2E, IS_NATIVE, IS_WEB} from '#/env'
import {createIsEnabledCheck, isExistingUserAsOf} from './utils'

export const enabled = createIsEnabledCheck(props => {
  return (
    !IS_E2E &&
    IS_NATIVE &&
    isExistingUserAsOf(
      '2026-02-05T00:00:00.000Z',
      props.currentProfile.createdAt,
    )
  )
})

export function DraftsAnnouncement() {
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
      <Dialog.Handle fill={t.palette.primary_400} />

      <Dialog.ScrollableInner
        label={_(msg`Introducing drafts`)}
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
              paddingTop: IS_WEB ? 24 : 40,
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
          <View
            style={[a.flex_row, a.align_center, a.gap_xs, {marginBottom: -12}]}>
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
          <Image
            accessibilityIgnoresInvertColors
            source={require('../../../../assets/images/drafts_announcement_nux.webp')}
            style={[
              a.w_full,
              {
                aspectRatio: 393 / 226,
              },
            ]}
            alt={_(
              msg({
                message: `A screenshot of the post composer with a new button next to the post button that says "Drafts", with a rainbow firework effect. Below, the text in the composer reads "Hey, did you hear the news? Bluesky has drafts now!!!".`,
                comment:
                  'Contains a post that originally appeared in English. Consider translating the post text if it makes sense in your language, and noting that the post was translated from English.',
              }),
            )}
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
                {
                  fontSize: IS_WEB ? 28 : 32,
                  maxWidth: 300,
                },
              ]}>
              <Trans>Drafts</Trans>
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
                Not ready to hit post? Keep your best ideas in Drafts until the
                timing is just right.
              </Trans>
            </Text>
          </View>

          {!IS_WEB && (
            <Button
              label={_(msg`Close`)}
              size="large"
              color="primary"
              onPress={() => control.close()}
              style={[a.w_full]}>
              <ButtonText>
                <Trans>Finally!</Trans>
              </ButtonText>
            </Button>
          )}
        </View>

        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}
