import {useCallback} from 'react'
import {View} from 'react-native'
import {Image} from 'expo-image'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {urls} from '#/lib/constants'
import {isNative} from '#/platform/detection'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {useNuxDialogContext} from '#/components/dialogs/nuxs'
import {Sparkle_Stroke2_Corner0_Rounded as SparkleIcon} from '#/components/icons/Sparkle'
import {VerifierCheck} from '#/components/icons/VerifierCheck'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'

export function InitialVerificationAnnouncement() {
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
        label={_(msg`Annoucing verification on Bluesky`)}
        style={[
          gtMobile ? {width: 'auto', maxWidth: 400, minWidth: 200} : a.w_full,
        ]}>
        <View style={[a.align_start, a.gap_lg]}>
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
                backgroundColor: t.palette.primary_25,
              },
            ]}>
            <SparkleIcon fill={t.palette.primary_700} size="sm" />
            <Text
              style={[
                a.font_bold,
                {
                  color: t.palette.primary_700,
                },
              ]}>
              New Feature
            </Text>
          </View>

          <View
            style={[
              a.w_full,
              a.rounded_md,
              a.overflow_hidden,
              t.atoms.bg_contrast_25,
              {minHeight: 100},
            ]}>
            <Image
              accessibilityIgnoresInvertColors
              source={require('../../../../assets/images/initial_verification_announcement_1.png')}
              style={[
                {
                  aspectRatio: 353 / 160,
                },
              ]}
            />
          </View>

          <View style={[a.gap_xs]}>
            <Text style={[a.text_2xl, a.font_bold, a.leading_snug]}>
              <Trans>Verification</Trans>
            </Text>
            <Text style={[a.leading_snug, a.text_md]}>
              <Trans>
                Some accounts — like government officials, journalists, public
                figures, or organizations — benefit from a verification badge
                that indicates their account is authentic.
              </Trans>
            </Text>
          </View>

          <View
            style={[
              a.w_full,
              a.rounded_md,
              a.overflow_hidden,
              t.atoms.bg_contrast_25,
              {minHeight: 100},
            ]}>
            <Image
              accessibilityIgnoresInvertColors
              source={require('../../../../assets/images/initial_verification_announcement_2.png')}
              style={[
                {
                  aspectRatio: 353 / 160,
                },
              ]}
            />
          </View>

          <View style={[a.gap_xs]}>
            <View style={[a.flex_row, a.align_center, a.gap_xs]}>
              <VerifierCheck width={18} />
              <Text style={[a.text_2xl, a.font_bold, a.leading_snug]}>
                <Trans>Who can verify?</Trans>
              </Text>
            </View>
            <Text style={[a.leading_snug, a.text_md]}>
              <Trans>
                Bluesky maintains a list of trusted verifiers — accounts whose
                vouches are automatically trusted. Bluesky itself can also
                verify individual accounts. If your account receives a vouch
                from one of these sources, you’ll get a blue checkmark on your
                profile and posts.
              </Trans>
            </Text>
          </View>

          <View style={[a.w_full, a.gap_md]}>
            <Link
              to={urls.website.blog.initialVerificationAnnouncement}
              label={_(msg`Read blog post`)}
              size="small"
              variant="solid"
              color="primary"
              style={[a.justify_center, a.w_full]}>
              <ButtonText>
                <Trans>Read blog post</Trans>
              </ButtonText>
            </Link>
            {isNative && (
              <Button
                label={_(msg`Close`)}
                size="small"
                variant="solid"
                color="secondary"
                style={[a.justify_center, a.w_full]}
                onPress={() => {
                  control.close()
                }}>
                <ButtonText>
                  <Trans>Close</Trans>
                </ButtonText>
              </Button>
            )}
          </View>
        </View>

        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}
