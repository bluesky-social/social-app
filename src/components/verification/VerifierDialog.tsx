import {Text as RNText, View} from 'react-native'
import {Image} from 'expo-image'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {urls} from '#/lib/constants'
import {getUserDisplayName} from '#/lib/getUserDisplayName'
import {logger} from '#/logger'
import {useSession} from '#/state/session'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {VerifierCheck} from '#/components/icons/VerifierCheck'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'
import {type FullVerificationState} from '#/components/verification'
import type * as bsky from '#/types/bsky'

export {useDialogControl} from '#/components/Dialog'

export function VerifierDialog({
  control,
  profile,
  verificationState,
}: {
  control: Dialog.DialogControlProps
  profile: bsky.profile.AnyProfileView
  verificationState: FullVerificationState
}) {
  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <Inner
        control={control}
        profile={profile}
        verificationState={verificationState}
      />
      <Dialog.Close />
    </Dialog.Outer>
  )
}

function Inner({
  profile,
  control,
}: {
  control: Dialog.DialogControlProps
  profile: bsky.profile.AnyProfileView
  verificationState: FullVerificationState
}) {
  const t = useTheme()
  const {_} = useLingui()
  const {gtMobile} = useBreakpoints()
  const {currentAccount} = useSession()

  const isSelf = profile.did === currentAccount?.did
  const userName = getUserDisplayName(profile)
  const label = isSelf
    ? _(msg`You are a trusted verifier`)
    : _(msg`${userName} is a trusted verifier`)

  return (
    <Dialog.ScrollableInner
      label={label}
      style={[
        gtMobile ? {width: 'auto', maxWidth: 400, minWidth: 200} : a.w_full,
      ]}>
      <View style={[a.gap_lg]}>
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
            source={require('../../../assets/images/initial_verification_announcement_1.png')}
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

        <View style={[a.gap_sm]}>
          <Text style={[a.text_2xl, a.font_bold, a.pr_4xl, a.leading_tight]}>
            {label}
          </Text>
          <Text style={[a.text_md, a.leading_snug]}>
            <Trans>
              Accounts with a scalloped blue check mark{' '}
              <RNText>
                <VerifierCheck width={14} />
              </RNText>{' '}
              can verify others. These trusted verifiers are selected by
              Bluesky.
            </Trans>
          </Text>
        </View>

        <View
          style={[
            a.w_full,
            a.gap_sm,
            a.justify_end,
            gtMobile ? [a.flex_row, a.justify_end] : [a.flex_col],
          ]}>
          <Link
            overridePresentation
            to={urls.website.blog.initialVerificationAnnouncement}
            label={_(msg`Learn more about verification on Bluesky`)}
            size="small"
            variant="solid"
            color="primary"
            style={[a.justify_center]}
            onPress={() => {
              logger.metric(
                'verification:learn-more',
                {
                  location: 'verifierDialog',
                },
                {statsig: true},
              )
            }}>
            <ButtonText>
              <Trans>Learn more</Trans>
            </ButtonText>
          </Link>
          <Button
            label={_(msg`Close dialog`)}
            size="small"
            variant="solid"
            color="secondary"
            onPress={() => {
              control.close()
            }}>
            <ButtonText>
              <Trans>Close</Trans>
            </ButtonText>
          </Button>
        </View>
      </View>
    </Dialog.ScrollableInner>
  )
}
