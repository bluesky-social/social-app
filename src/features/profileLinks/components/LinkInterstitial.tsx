import {View} from 'react-native'
import {getBlobCidString} from '@atproto/lex'
import {Trans, useLingui} from '@lingui/react/macro'

import {useOpenLink} from '#/lib/hooks/useOpenLink'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useBreakpoints, useTheme, web} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {
  ArrowRight_Stroke2_Corner0_Rounded as ArrowRightIcon,
  ArrowTopRight_Stroke2_Corner0_Rounded as ArrowTopRightIcon,
} from '#/components/icons/Arrow'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import type * as bsky from '#/types/bsky'
import {useSupportPalette} from '../palette'
import {getLinkHost, getSupportProvider} from '../providers'
import {type ProfileLink} from '../types'
import {LinkFavicon} from './LinkFavicon'
import {ProviderLogo} from './ProviderLogo'

/**
 * Shown before a profile link opens: you're leaving Bluesky, the account
 * owner added the link and Bluesky hasn't checked it, and the full
 * destination. Support links add that the provider handles payment. Also the
 * path to report the link.
 */
export function LinkInterstitial({
  control,
  link,
  profile,
  onReport,
}: {
  control: Dialog.DialogControlProps
  link: ProfileLink | null
  profile: bsky.profile.AnyProfileView
  /** Runs after the sheet closes. Omit to hide the report option. */
  onReport?: () => void
}) {
  return (
    <Dialog.Outer
      control={control}
      nativeOptions={{preventExpansion: true}}
      webOptions={{alignCenter: true}}>
      <Dialog.Handle />
      {link ? (
        <LinkInterstitialInner
          link={link}
          profile={profile}
          onReport={onReport}
        />
      ) : null}
    </Dialog.Outer>
  )
}

function LinkInterstitialInner({
  link,
  profile,
  onReport,
}: {
  link: ProfileLink
  profile: bsky.profile.AnyProfileView
  onReport?: () => void
}) {
  const control = Dialog.useDialogContext()
  const {t: l} = useLingui()
  const t = useTheme()
  const ax = useAnalytics()
  const palette = useSupportPalette()
  const openLink = useOpenLink()
  const {gtMobile} = useBreakpoints()

  const provider = getSupportProvider(link.url)
  const host = getLinkHost(link.url)
  const destination = provider?.name ?? host
  const ownerName = sanitizeDisplayName(profile.displayName || profile.handle)

  const onContinue = () => {
    ax.metric('profile:links:continue', {
      domain: host,
      supportProvider: provider?.name,
    })
    control.close(() => {
      openLink(link.url, undefined, true)
    })
  }

  return (
    <Dialog.ScrollableInner
      style={web({maxWidth: 440})}
      label={l`Leaving Bluesky`}>
      <View style={[a.gap_2xl]}>
        <View style={[a.gap_lg]}>
          <View style={[a.flex_row, a.align_center, a.gap_sm, a.mt_sm]}>
            <UserAvatar type="user" size={48} avatar={profile.avatar} />
            <ArrowRightIcon size="md" style={t.atoms.text_contrast_low} />
            <View
              style={[
                a.align_center,
                a.justify_center,
                a.rounded_full,
                a.border,
                {width: 48, height: 48},
                provider
                  ? {
                      backgroundColor: palette.tintBg,
                      borderColor: palette.tintBorder,
                    }
                  : [t.atoms.bg_contrast_25, t.atoms.border_contrast_low],
              ]}>
              {!provider && link.icon ? (
                <LinkFavicon
                  key={getBlobCidString(link.icon)}
                  did={profile.did}
                  icon={link.icon}
                  size={24}
                  fallback={
                    <ProviderLogo
                      provider={undefined}
                      size="lg"
                      style={t.atoms.text_contrast_medium}
                    />
                  }
                />
              ) : (
                <ProviderLogo
                  provider={provider}
                  size="lg"
                  style={
                    provider
                      ? {color: palette.tintText}
                      : t.atoms.text_contrast_medium
                  }
                />
              )}
            </View>
          </View>

          <View style={[a.gap_sm]}>
            <Text style={[a.text_2xl, a.font_bold, a.leading_tight]}>
              <Trans>Continue to {destination}</Trans>
            </Text>
            <Text
              emoji
              style={[a.text_md, a.leading_snug, t.atoms.text_contrast_high]}>
              {provider ? (
                <Trans>
                  You’re leaving Bluesky. This link was added by {ownerName} and
                  Bluesky hasn’t checked where it goes. {provider.name} handles
                  payments on its own site, and Bluesky can’t help with refunds
                  or disputes.
                </Trans>
              ) : (
                <Trans>
                  You’re leaving Bluesky. This link was added by {ownerName} and
                  Bluesky hasn’t checked where it goes.
                </Trans>
              )}
            </Text>
          </View>

          <DestinationBox url={link.url} />
        </View>

        <View
          style={[a.gap_sm, gtMobile && [a.flex_row_reverse, a.justify_start]]}>
          <Button
            testID="profileLinkContinueBtn"
            label={l`Continue to ${destination}`}
            accessibilityHint={l`Opens ${link.url} outside Bluesky`}
            onPress={onContinue}
            size="large"
            color="primary"
            style={provider && {backgroundColor: palette.bg}}
            hoverStyle={
              provider ? {backgroundColor: palette.bgHover} : undefined
            }>
            <ButtonText>
              <Trans>Continue to {destination}</Trans>
            </ButtonText>
            <ButtonIcon icon={ArrowTopRightIcon} />
          </Button>
          <Button
            label={l`Not now`}
            onPress={() => control.close()}
            size="large"
            color="secondary"
            variant="ghost">
            <ButtonText>
              <Trans>Not now</Trans>
            </ButtonText>
          </Button>
        </View>

        {onReport ? (
          <Button
            testID="profileLinkReportBtn"
            label={l`Report this link`}
            onPress={() => control.close(onReport)}
            size="tiny"
            color="secondary"
            variant="ghost"
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

function DestinationBox({url}: {url: string}) {
  const t = useTheme()
  let host = url
  let rest = ''
  try {
    const parsed = new URL(url)
    host = parsed.hostname.replace(/^www\./, '')
    rest = parsed.pathname.replace(/\/$/, '') + parsed.search
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
        numberOfLines={2}
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
