import {useCallback} from 'react'
import {View} from 'react-native'
import {Image} from 'expo-image'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {urls} from '#/lib/constants'
import {logger} from '#/logger'
import {isNative} from '#/platform/detection'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {useNuxDialogContext} from '#/components/dialogs/nuxs'
import {Sparkle_Stroke2_Corner0_Rounded as SparkleIcon} from '#/components/icons/Sparkle'
import {VerifierCheck} from '#/components/icons/VerifierCheck'
import {Link} from '#/components/Link'
import {Span, Text} from '#/components/Typography'

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
        label={_(msg`Announcing verification on Bluesky`)}
        style={[
          gtMobile ? {width: 'auto', maxWidth: 400, minWidth: 200} : a.w_full,
        ]}>
        <View style={[a.align_start, a.gap_xl]}>
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
                a.font_semi_bold,
                {
                  color: t.palette.primary_700,
                },
              ]}>
              <Trans>New Feature</Trans>
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
              alt={_(
                msg`An illustration showing that Bluesky selects trusted verifiers, and trusted verifiers in turn verify individual user accounts.`,
              )}
            />
          </View>

          <View style={[a.gap_xs]}>
            <Text style={[a.text_2xl, a.font_semi_bold, a.leading_snug]}>
              <Trans>A new form of verification</Trans>
            </Text>
            <Text style={[a.leading_snug, a.text_md]}>
              <Trans>
                We’re introducing a new layer of verification on Bluesky — an
                easy-to-see checkmark.
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
                  aspectRatio: 353 / 196,
                },
              ]}
              alt={_(
                msg`An mockup of a iPhone showing the Bluesky app open to the profile of a verified user with a blue checkmark next to their display name.`,
              )}
            />
          </View>

          <View style={[a.gap_sm]}>
            <View style={[a.flex_row, a.align_center, a.gap_xs]}>
              <VerifierCheck width={14} />
              <Text style={[a.text_lg, a.font_semi_bold, a.leading_snug]}>
                <Trans>Who can verify?</Trans>
              </Text>
            </View>
            <View style={[a.gap_sm]}>
              <Text style={[a.leading_snug, a.text_md]}>
                <Trans>
                  Bluesky will proactively verify notable and authentic
                  accounts.
                </Trans>
              </Text>
              <Text style={[a.leading_snug, a.text_md]}>
                <Trans>
                  Trust emerges from relationships, communities, and shared
                  context, so we’re also enabling{' '}
                  <Span style={[a.font_semi_bold]}>trusted verifiers</Span>:
                  organizations that can directly issue verification.
                </Trans>
              </Text>
              <Text style={[a.leading_snug, a.text_md]}>
                <Trans>
                  When you tap on a check, you’ll see which organizations have
                  granted verification.
                </Trans>
              </Text>
            </View>
          </View>

          <View style={[a.w_full, a.gap_md]}>
            <Link
              overridePresentation
              to={urls.website.blog.initialVerificationAnnouncement}
              label={_(msg`Read blog post`)}
              size="small"
              variant="solid"
              color="primary"
              style={[a.justify_center, a.w_full]}
              onPress={() => {
                logger.metric(
                  'verification:learn-more',
                  {
                    location: 'initialAnnouncementeNux',
                  },
                  {statsig: false},
                )
              }}>
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
