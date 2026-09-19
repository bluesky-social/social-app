import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {useOpenLink} from '#/lib/hooks/useOpenLink'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {toNiceDomain} from '#/lib/strings/url-helpers'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useBreakpoints, useTheme, web} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {useGlobalDialogsControlContext} from '#/components/dialogs/Context'
import {
  ArrowRight_Stroke2_Corner0_Rounded as ArrowRight,
  ArrowTopRight_Stroke2_Corner0_Rounded as ArrowTopRight,
} from '#/components/icons/Arrow'
import {Text} from '#/components/Typography'
import type * as bsky from '#/types/bsky'
import {useSupportPalette} from '../palette'
import {getSupportProvider} from '../providers'
import {ProviderBadge} from './ProviderBadge'
import {SupportedBy} from './SupportedBy'

/**
 * The disclosure sheet shown every time someone taps Support. It exists to
 * make three things unmistakable before money moves: you're leaving Bluesky,
 * the provider (not Bluesky) handles the payment, and Bluesky can't help with
 * refunds. It also carries the report path so a suspicious button is one tap
 * from moderation.
 */
export function SupportInterstitial({
  control,
  uri,
  creator,
}: {
  control: Dialog.DialogControlProps
  uri: string
  creator?: bsky.profile.AnyProfileView
}) {
  return (
    <Dialog.Outer
      control={control}
      nativeOptions={{preventExpansion: true}}
      webOptions={{alignCenter: true}}>
      <Dialog.Handle />
      <SupportInterstitialInner uri={uri} creator={creator} />
    </Dialog.Outer>
  )
}

function SupportInterstitialInner({
  uri,
  creator,
}: {
  uri: string
  creator?: bsky.profile.AnyProfileView
}) {
  const control = Dialog.useDialogContext()
  const {t: l} = useLingui()
  const t = useTheme()
  const palette = useSupportPalette()
  const openLink = useOpenLink()
  const {gtMobile} = useBreakpoints()
  const {reportDialogControl} = useGlobalDialogsControlContext()

  const provider = getSupportProvider(uri)
  const providerName = provider?.name ?? toNiceDomain(uri)
  const creatorName = creator
    ? sanitizeDisplayName(creator.displayName || creator.handle)
    : null

  const onContinue = () => {
    control.close(() => {
      openLink(uri, undefined, true)
    })
  }

  const onReport = () => {
    if (!creator) return
    control.close(() => {
      reportDialogControl.open({
        subject: {
          ...creator,
          $type: 'app.bsky.actor.defs#profileViewBasic',
        },
      })
    })
  }

  return (
    <Dialog.ScrollableInner
      style={web({maxWidth: 440})}
      label={l`Leaving Bluesky to support this creator`}>
      <View style={[a.gap_2xl]}>
        <View style={[a.gap_lg]}>
          <View style={[a.flex_row, a.align_center, a.gap_sm, {marginTop: 8}]}>
            {creator ? (
              <UserAvatar type="user" size={56} avatar={creator.avatar} />
            ) : null}
            <ArrowRight size="md" style={t.atoms.text_contrast_low} />
            <ProviderBadge provider={provider} size={56} />
          </View>

          <View style={[a.gap_sm]}>
            <Text emoji style={[a.font_bold, a.text_2xl, a.leading_tight]}>
              {creatorName ? (
                <Trans>
                  Support {creatorName} on {providerName}
                </Trans>
              ) : (
                <Trans>Continue to {providerName}</Trans>
              )}
            </Text>
            <Text
              style={[a.text_md, a.leading_snug, t.atoms.text_contrast_high]}>
              <Trans>
                You’re leaving Bluesky. {providerName} handles the payment on
                its own site. Bluesky can’t help with refunds or disputes.
              </Trans>
            </Text>
            <SupportedBy creator={creator} />
          </View>

          <DestinationBox uri={uri} />
        </View>

        <View
          style={[a.gap_sm, gtMobile && [a.flex_row_reverse, a.justify_start]]}>
          <Button
            label={l`Continue to ${providerName}`}
            accessibilityHint={l`Opens ${uri} outside Bluesky`}
            onPress={onContinue}
            size="large"
            color="primary"
            style={{backgroundColor: palette.bg}}
            hoverStyle={{backgroundColor: palette.bgHover}}>
            <ButtonText>
              <Trans>Continue to {providerName}</Trans>
            </ButtonText>
            <ButtonIcon icon={ArrowTopRight} />
          </Button>
          <Button
            label={l`Not now`}
            onPress={() => control.close()}
            size="large"
            variant="ghost"
            color="secondary">
            <ButtonText>
              <Trans>Not now</Trans>
            </ButtonText>
          </Button>
        </View>

        {creator ? (
          <Button
            label={l`Report this Support button`}
            onPress={onReport}
            size="tiny"
            variant="ghost"
            color="secondary"
            style={a.self_center}>
            <ButtonText style={[a.font_normal, t.atoms.text_contrast_medium]}>
              <Trans>Something off about this link? Report it</Trans>
            </ButtonText>
          </Button>
        ) : null}
      </View>
      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}

function DestinationBox({uri}: {uri: string}) {
  const t = useTheme()
  let host = uri
  let rest = ''
  try {
    const url = new URL(uri)
    host = url.hostname.replace(/^www\./, '')
    rest = (url.pathname.replace(/\/$/, '') + url.search).slice(0, 60)
  } catch {}
  return (
    <View
      style={[
        a.px_md,
        a.rounded_sm,
        a.border,
        t.atoms.bg_contrast_25,
        t.atoms.border_contrast_low,
        {paddingVertical: 10},
      ]}>
      <Text
        numberOfLines={1}
        style={[a.text_md, a.leading_snug, t.atoms.text_contrast_medium]}>
        <Text
          style={[a.text_md, a.leading_snug, a.font_semi_bold, t.atoms.text]}>
          {host}
        </Text>
        {rest}
      </Text>
    </View>
  )
}
