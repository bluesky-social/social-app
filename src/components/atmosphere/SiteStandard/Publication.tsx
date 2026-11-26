import {type StyleProp, View, type ViewStyle} from 'react-native'
import {AtUri} from '@atproto/syntax'
import {plural} from '@lingui/core/macro'
import {Trans, useLingui} from '@lingui/react/macro'

import {useHaptics} from '#/lib/haptics'
import {makeProfileLink} from '#/lib/routes/links'
import {shareUrl} from '#/lib/sharing'
import {sanitizeHandle} from '#/lib/strings/handles'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useSession} from '#/state/session'
import {formatCount} from '#/view/com/util/numeric/format'
import {AppName} from '#/screens/Atmosphere/ActivityTab/components/ActivityHeader'
import {isActorHidden} from '#/screens/Atmosphere/ActivityTab/moderation'
import {AtmosphereCardMenu} from '#/screens/Atmosphere/components/AtmosphereCardMenu'
import {atoms as a, useTheme} from '#/alf'
import {AtmosphereFirstActionWelcomeDialog} from '#/components/atmosphere/AtmosphereFirstActionWelcomeDialog'
import {
  toSubscribableView,
  useAtmosphereLike,
  useAtmosphereLikeCount,
} from '#/components/atmosphere/likes'
import {getAtmosphereProvider} from '#/components/atmosphere/providers'
import {PublicationIcon} from '#/components/atmosphere/SiteStandard/PublicationIcon'
import type * as ssTypes from '#/components/atmosphere/SiteStandard/types'
import {isStandardSitePublicationUri} from '#/components/atmosphere/SiteStandard/utils'
import {AvatarStack} from '#/components/AvatarStack'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {Check_Stroke2_Corner0_Rounded as CheckIcon} from '#/components/icons/Check'
import {PlusLarge_Stroke2_Corner0_Rounded as PlusIcon} from '#/components/icons/Plus'
import {InlineLinkText, Link} from '#/components/Link'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {IS_NATIVE} from '#/env'
import {type app, site} from '#/lexicons'

type PublicationView = app.bsky.embed.external.ViewArticlePublication
type Profile = app.bsky.actor.defs.ProfileViewBasic

const ICON_SIZE = 48

/**
 * A publication card for the Atmosphere screens: its icon, name, author and
 * app, description, subscribers, then a subscribe button and a menu. Only the
 * icon and name open the publication, leaving the rest free for other
 * actions.
 */
export function PublicationCard({
  view,
  preview,
  onPressCallback,
  onShareCallback,
  style,
}: ssTypes.PreviewProps &
  ssTypes.PublicApiProps & {
    view: PublicationView
    style?: StyleProp<ViewStyle>
  }) {
  const ax = useAnalytics()
  const t = useTheme()
  const {t: l} = useLingui()
  const haptics = useHaptics()

  /* The publication's owner is the repo that holds its publication record. */
  const publicationRef = view.associatedRefs?.find(isStandardSitePublicationUri)
  const authorDid = publicationRef && new AtUri(publicationRef.uri).host
  const author = authorDid
    ? view.associatedProfiles?.find(p => p.did === authorDid)
    : undefined
  const label = view.title ? l`View ${view.title}` : l`View publication`

  const linkProps = {
    to: view.uri,
    shouldProxy: true,
    // The name is the publication's own, not a claim about where it links.
    disableMismatchWarning: true,
    label,
    accessibilityHint: '',
    onPress: () => {
      haptics.tap()
      onPressCallback?.('card')
      ax.metric('embed:standardSite:publication:press', {url: view.uri})
    },
    onLongPress: IS_NATIVE
      ? () => {
          haptics.longPress()
          onShareCallback?.()
          void shareUrl(view.uri)
          ax.metric('embed:standardSite:publication:longPress', {
            url: view.uri,
          })
        }
      : undefined,
  }

  return (
    <View
      testID="publicationCard"
      style={[
        a.w_full,
        a.overflow_hidden,
        a.rounded_lg,
        a.border,
        t.atoms.bg,
        t.atoms.border_contrast_low,
        preview && a.pointer_events_none,
        style,
      ]}>
      <View
        style={[
          a.flex_row,
          a.align_center,
          a.gap_md,
          a.p_md,
          t.atoms.bg_contrast_25,
        ]}>
        <Link
          {...linkProps}
          testID="publicationIcon"
          style={[a.flex_shrink_0, a.rounded_sm]}>
          <PublicationIcon view={view} size={ICON_SIZE} />
        </Link>
        <View style={[a.flex_1, a.gap_2xs]}>
          <InlineLinkText
            {...linkProps}
            testID="publicationTitle"
            emoji
            numberOfLines={2}
            style={[a.text_lg, a.font_bold, a.leading_tight, t.atoms.text]}>
            {view.title}
          </InlineLinkText>
          <Byline view={view} author={author} />
        </View>
      </View>

      <View style={[a.gap_sm, a.px_md, a.pt_md]}>
        {!!view.description?.trim() && (
          <Text
            emoji
            numberOfLines={3}
            style={[a.text_sm, a.leading_snug, t.atoms.text_contrast_high]}>
            {view.description}
          </Text>
        )}
        <Subscribers view={view} />
      </View>

      <View
        style={[
          a.flex_row,
          a.align_center,
          a.gap_sm,
          a.px_md,
          a.pt_md,
          a.pb_md,
        ]}>
        {!preview && <SubscribeButton view={view} />}
        {!preview && (
          <View style={a.ml_auto}>
            <AtmosphereCardMenu
              inline
              type="publication"
              item={view}
              reportableTypes={[site.standard.publication.$type]}
              author={author}
            />
          </View>
        )}
      </View>
    </View>
  )
}

/**
 * "by @handle on [icon] App". The handle opens the author's profile; the app
 * is the one the appview attributes the publication to.
 */
function Byline({view, author}: {view: PublicationView; author?: Profile}) {
  const {t: l} = useLingui()
  const t = useTheme()
  const provider = getAtmosphereProvider(view.providerId)
  const handle = author && sanitizeHandle(author.handle, '@')

  if (!author || !handle) {
    if (!provider) return null
    return (
      <Text
        numberOfLines={1}
        style={[a.text_sm, a.leading_snug, t.atoms.text_contrast_medium]}>
        <Trans comment='The app a publication is on, e.g. "on Leaflet". The app name includes its icon.'>
          on <AppName app={provider}>{provider.name}</AppName>
        </Trans>
      </Text>
    )
  }

  const handleLink = (
    <InlineLinkText
      testID="publicationAuthor"
      to={makeProfileLink(author)}
      label={l`View profile of ${handle}`}
      style={[a.text_sm, a.leading_snug, t.atoms.text_contrast_medium]}>
      {handle}
    </InlineLinkText>
  )

  return (
    <Text
      numberOfLines={1}
      style={[a.text_sm, a.leading_snug, t.atoms.text_contrast_medium]}>
      {provider ? (
        <Trans comment='Under the name of a publication: who writes it and the app it is on, e.g. "by @alice.com on Leaflet". The handle links to their profile, and the app name includes its icon.'>
          by {handleLink} on <AppName app={provider}>{provider.name}</AppName>
        </Trans>
      ) : (
        <Trans comment='Under the name of a publication: who writes it, e.g. "by @alice.com". The handle links to their profile.'>
          by {handleLink}
        </Trans>
      )}
    </Text>
  )
}

/**
 * Up to three subscribers' avatars, preferring people the viewer follows,
 * then the total and how many of them the viewer follows.
 */
function Subscribers({view}: {view: PublicationView}) {
  const {t: l, i18n} = useLingui()
  const t = useTheme()
  const moderationOpts = useModerationOpts()
  const {currentAccount} = useSession()
  const count = useAtmosphereLikeCount(toSubscribableView(view), 'subscribe')
  const knownCount = view.viewer?.knownSubscriberCount ?? 0

  const known = view.viewer?.knownSubscribers ?? []
  const profiles = (known.length ? known : (view.subscribers ?? []))
    .filter(
      profile =>
        profile.did !== currentAccount?.did &&
        !!moderationOpts &&
        !isActorHidden(profile, moderationOpts),
    )
    .slice(0, 3)

  if (!count && !profiles.length) return null

  const details = [
    count > 0 &&
      l({
        message: plural(count, {
          one: `${formatCount(i18n, count)} subscriber`,
          other: `${formatCount(i18n, count)} subscribers`,
        }),
        comment: 'Number of people subscribed to a publication.',
      }),
    knownCount > 0 &&
      l({
        message: plural(knownCount, {
          one: `${formatCount(i18n, knownCount)} you follow`,
          other: `${formatCount(i18n, knownCount)} you follow`,
        }),
        comment:
          'How many of a publication’s subscribers the viewer follows, after the number of subscribers, e.g. “31 subscribers · 2 you follow”.',
      }),
  ].filter(Boolean)

  return (
    <View style={[a.flex_row, a.align_center, a.gap_sm]}>
      {profiles.length > 0 && (
        <View accessible={false} pointerEvents="none">
          <AvatarStack profiles={profiles} size={20} overlap={6} />
        </View>
      )}
      <Text
        numberOfLines={1}
        style={[
          a.flex_1,
          a.text_sm,
          a.leading_snug,
          t.atoms.text_contrast_medium,
        ]}>
        {details.join(' · ')}
      </Text>
    </View>
  )
}

/**
 * Subscribes to the publication, or undoes it. Hidden when there's no
 * publication record to subscribe to, or the viewer's subscription is
 * unknown, since subscribing then could create a duplicate.
 */
function SubscribeButton({view}: {view: PublicationView}) {
  const {t: l} = useLingui()
  const {
    canLike,
    isLiked: isSubscribed,
    toggle,
    firstActionWelcomeDialogControl,
  } = useAtmosphereLike(toSubscribableView(view), 'subscribe', 'card')

  if (!canLike) return null

  return (
    <>
      <Button
        testID="publicationSubscribe"
        label={
          isSubscribed
            ? l({
                message: 'Unsubscribe',
                comment: 'Button that unsubscribes from a publication',
              })
            : l({
                message: 'Subscribe',
                comment: 'Button that subscribes to a publication',
              })
        }
        size="small"
        color={isSubscribed ? 'primary_subtle' : 'secondary'}
        onPress={toggle}>
        <ButtonIcon icon={isSubscribed ? CheckIcon : PlusIcon} />
        <ButtonText>
          {isSubscribed ? (
            <Trans comment="On a button, once the viewer has subscribed to a publication">
              Subscribed
            </Trans>
          ) : (
            <Trans comment="Button that subscribes to a publication">
              Subscribe
            </Trans>
          )}
        </ButtonText>
      </Button>
      <AtmosphereFirstActionWelcomeDialog
        control={firstActionWelcomeDialogControl}
      />
    </>
  )
}
