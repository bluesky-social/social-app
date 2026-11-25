import {useState} from 'react'
import {type StyleProp, View, type ViewStyle} from 'react-native'
import {Image} from 'expo-image'
import {Trans, useLingui} from '@lingui/react/macro'

import {useHaptics} from '#/lib/haptics'
import {shareUrl} from '#/lib/sharing'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {toNiceDomain} from '#/lib/strings/url-helpers'
import {AtmosphereCardMenu} from '#/screens/Atmosphere/components/AtmosphereCardMenu'
import {getAssociatedProfile} from '#/screens/Atmosphere/data/exploreData'
import {atoms as a, useTheme} from '#/alf'
import {useCardSurface} from '#/components/atmosphere/cardSurface'
import {useKnownLikers} from '#/components/atmosphere/KnownLikers'
import {LikeButton} from '#/components/atmosphere/LikeButton'
import {getAtmosphereProvider} from '#/components/atmosphere/providers'
import {SharePillButton} from '#/components/atmosphere/SharePillButton'
import {AccentLinkButton} from '#/components/atmosphere/SiteStandard/AccentLinkButton'
import {PublicationIcon} from '#/components/atmosphere/SiteStandard/PublicationIcon'
import type * as ssTypes from '#/components/atmosphere/SiteStandard/types'
import {getPublicationTheme} from '#/components/atmosphere/SiteStandard/utils'
import {AvatarStack} from '#/components/AvatarStack'
import {Clock_Stroke2_Corner0_Rounded as ClockIcon} from '#/components/icons/Clock'
import {InlineLinkText, Link} from '#/components/Link'
import {MediaInsetBorder} from '#/components/MediaInsetBorder'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {IS_NATIVE} from '#/env'
import {type app, site} from '#/lexicons'

const THUMBNAIL_HEIGHT = 88
/**
 * The common link-preview shape (1200x630), used until the image loads, since
 * standard.site doesn't record a cover image's size.
 */
const DEFAULT_THUMBNAIL_RATIO = 1.91
/** Width over height: never narrower than square, nor wider than this. */
const MAX_THUMBNAIL_RATIO = 1.91
/** Narrows the thumbnail from the image's shape, cropping its sides. */
const THUMBNAIL_WIDTH_SCALE = 0.75
const PUBLICATION_ICON_SIZE = 20

/**
 * People the viewer follows who recommended the document within the same
 * stretch of timeline, shown ahead of `knownLikers`.
 */
export type DocumentRecommenders = {
  /** The ones to show, with moderated actors left out. Never empty. */
  actors: app.bsky.actor.defs.ProfileViewBasic[]
  /** Every one, including moderated actors. */
  actorCount: number
}

type DocumentProps = ssTypes.PublicApiProps & {
  view: app.bsky.embed.external.ViewArticle
  /**
   * `default` shows the image full width above the title; `compact` shows it
   * as a thumbnail beside the title.
   */
  variant?: 'default' | 'compact'
  /** Shown ahead of the view's `knownLikers`. */
  recommenders?: DocumentRecommenders
  /** Leaves out the date and reading time. */
  hideMeta?: boolean
  /** Shown at the bottom of the card, e.g. a link to related articles. */
  footer?: React.ReactNode
  style?: StyleProp<ViewStyle>
}

/**
 * An article card: its publication, title, description, details and image,
 * then a recommend button and known recommenders. Only the image and title
 * open the article, leaving the rest free for other actions. Always uses the
 * app's own colors, not the publication's.
 */
export function Document({
  view,
  variant = 'default',
  recommenders,
  hideMeta = false,
  footer,
  onPressCallback,
  onShareCallback,
  style,
}: DocumentProps) {
  const ax = useAnalytics()
  const {t: l} = useLingui()
  const t = useTheme()
  const haptics = useHaptics()
  const author = getAssociatedProfile(view.associatedProfiles)
  const label = view.title || l`Open link to ${toNiceDomain(view.uri)}`
  const surface = useCardSurface()
  const [thumbnailRatio, setThumbnailRatio] = useState(DEFAULT_THUMBNAIL_RATIO)

  const linkProps = {
    to: view.uri,
    shouldProxy: true,
    // Titles are the article's own, not a claim about where it links.
    disableMismatchWarning: true,
    accessibilityHint: '',
    onPress: () => {
      haptics.tap()
      onPressCallback?.('card')
      ax.metric('embed:standardSite:article:press', {url: view.uri})
    },
    onLongPress: IS_NATIVE
      ? () => {
          haptics.longPress()
          onShareCallback?.()
          void shareUrl(view.uri)
          ax.metric('embed:standardSite:article:longPress', {url: view.uri})
        }
      : undefined,
  }

  const image = view.image && (
    <Image
      source={{uri: view.image}}
      contentFit="cover"
      accessibilityIgnoresInvertColors
      loading="lazy"
      useAppleWebpCodec
      style={[a.w_full, a.h_full]}
      onLoad={e => {
        const {width, height} = e.source
        if (width > 0 && height > 0) setThumbnailRatio(width / height)
      }}
    />
  )
  const clampedRatio = Math.min(
    MAX_THUMBNAIL_RATIO,
    Math.max(1, thumbnailRatio),
  )

  return (
    <View
      testID="document"
      style={[a.w_full, a.gap_sm, a.p_md, a.rounded_lg, surface.style, style]}>
      <View style={[a.flex_row, a.align_center, a.gap_sm]}>
        {view.publisher ? (
          <PublicationHeader publication={view.publisher} />
        ) : (
          <View style={[a.flex_1]} />
        )}
        <AtmosphereCardMenu
          inline
          type="article"
          item={view}
          reportableTypes={[site.standard.document.$type]}
          author={author}
        />
      </View>
      {variant === 'default' && image && (
        <Link
          {...linkProps}
          testID="documentImage"
          label={label}
          style={[
            a.w_full,
            a.aspect_card,
            a.overflow_hidden,
            a.rounded_md,
            t.atoms.bg_contrast_25,
          ]}>
          {image}
          <MediaInsetBorder />
        </Link>
      )}
      <View style={[a.flex_row, a.align_start, a.gap_md]}>
        <View style={[a.flex_1, a.gap_xs]}>
          {!!view.title && (
            <InlineLinkText
              {...linkProps}
              testID="documentTitle"
              label={label}
              emoji
              numberOfLines={3}
              style={[a.text_lg, a.font_bold, a.leading_snug, t.atoms.text]}>
              {view.title}
            </InlineLinkText>
          )}
          {!!view.description.trim() && (
            <Text
              emoji
              numberOfLines={2}
              style={[a.text_md, a.leading_snug, t.atoms.text_contrast_high]}>
              {view.description}
            </Text>
          )}
          {!hideMeta && (
            <DocumentMeta
              date={view.createdAt}
              readingTime={view.readingTime}
            />
          )}
        </View>
        {variant === 'compact' && image && (
          <Link
            {...linkProps}
            testID="documentImage"
            label={label}
            style={[
              a.flex_shrink_0,
              a.overflow_hidden,
              a.rounded_md,
              t.atoms.bg_contrast_25,
              {
                width: Math.round(
                  THUMBNAIL_HEIGHT * clampedRatio * THUMBNAIL_WIDTH_SCALE,
                ),
                height: THUMBNAIL_HEIGHT,
              },
            ]}>
            {image}
            <MediaInsetBorder />
          </Link>
        )}
      </View>
      <View style={[a.flex_row, a.align_center, a.gap_sm, a.pt_xs]}>
        <LikeButton
          view={view}
          kind="recommend"
          appearance="pill"
          testID="documentRecommend"
        />
        <SharePillButton
          testID="documentShare"
          label={l`Share article`}
          url={view.uri}
          onShare={onShareCallback}
        />
        <View style={[a.flex_1]} />
        <ReadButton
          view={view}
          linkProps={{
            ...linkProps,
            onPress: () => {
              haptics.tap()
              onPressCallback?.('cta')
              ax.metric('embed:standardSite:article:press', {url: view.uri})
            },
          }}
        />
      </View>
      <RecommendedBy view={view} leadingProfiles={recommenders?.actors} />
      {footer}
    </View>
  )
}

/**
 * Opens the article, named for the app it was published with when known.
 * Tinted with the publication's accent color, if it has one.
 */
function ReadButton({
  view,
  linkProps,
}: {
  view: app.bsky.embed.external.ViewArticle
  linkProps: Omit<React.ComponentProps<typeof Link>, 'label' | 'children'>
}) {
  const {t: l} = useLingui()
  const provider = getAtmosphereProvider(view.providerId)
  const label = provider
    ? l({
        message: `Read on ${provider.name}`,
        comment:
          'Button that opens an article in the app it was published with, e.g. “Read on Leaflet”. {name} is the app’s name.',
      })
    : l`Read article`

  return (
    <AccentLinkButton
      {...linkProps}
      testID="documentRead"
      label={label}
      accent={
        view.publisher ? getPublicationTheme(view.publisher)?.accent : undefined
      }
    />
  )
}

/**
 * Who the viewer follows that recommended the article, e.g. “Recommended by
 * Alice and others”. Hidden when there's no one.
 */
function RecommendedBy({
  view,
  leadingProfiles,
}: {
  view: app.bsky.embed.external.ViewArticle
  leadingProfiles?: app.bsky.actor.defs.ProfileViewBasic[]
}) {
  const t = useTheme()
  const profiles = useKnownLikers(view, leadingProfiles)
  if (!profiles.length) return null

  const nameOf = (profile: app.bsky.actor.defs.ProfileViewBasic) =>
    sanitizeDisplayName(profile.displayName || sanitizeHandle(profile.handle))
  const first = nameOf(profiles[0])
  const total = Math.max(view.likeCount ?? 0, profiles.length)
  const nameStyle = [a.font_semi_bold, t.atoms.text_contrast_high]

  return (
    <View
      testID="documentRecommendedBy"
      style={[a.flex_row, a.align_center, a.gap_sm]}>
      <View accessible={false} pointerEvents="none">
        <AvatarStack profiles={profiles.slice(0, 3)} size={20} overlap={6} />
      </View>
      <Text
        emoji
        numberOfLines={1}
        style={[a.flex_1, a.text_sm, t.atoms.text_contrast_medium]}>
        {total === 1 ? (
          <Trans comment="Who recommended an article. {first} is the name of someone the viewer follows.">
            Recommended by <Text style={nameStyle}>{first}</Text>
          </Trans>
        ) : total === 2 && profiles.length === 2 ? (
          <Trans comment="Who recommended an article. {first} and {second} are names of people the viewer follows.">
            Recommended by <Text style={nameStyle}>{first}</Text> and{' '}
            <Text style={nameStyle}>{nameOf(profiles[1])}</Text>
          </Trans>
        ) : (
          <Trans comment="Who recommended an article. {first} is the name of someone the viewer follows; others may include people they don't.">
            Recommended by <Text style={nameStyle}>{first}</Text> and{' '}
            <Text style={nameStyle}>others</Text>
          </Trans>
        )}
      </Text>
    </View>
  )
}

/** The publication's icon and name, both of which open the publication. */
function PublicationHeader({
  publication,
}: {
  publication: app.bsky.embed.external.ViewArticlePublication
}) {
  const {t: l} = useLingui()
  const t = useTheme()
  const publicationLabel = l({
    message: `Open publication: ${publication.title}`,
    comment:
      'Accessibility label for a link to the publication an article was published in. {title} is its name, written by its author.',
  })

  return (
    <View style={[a.flex_1, a.flex_row, a.align_center, a.gap_sm]}>
      <Link
        testID="documentPublicationIcon"
        to={publication.uri}
        shouldProxy
        label={publicationLabel}
        accessibilityHint=""
        style={[a.rounded_xs]}>
        <PublicationIcon view={publication} size={PUBLICATION_ICON_SIZE} />
      </Link>
      <InlineLinkText
        testID="documentPublication"
        to={publication.uri}
        shouldProxy
        disableMismatchWarning
        label={publicationLabel}
        emoji
        numberOfLines={1}
        style={[a.flex_1, a.text_md, a.leading_snug, t.atoms.text]}>
        {publication.title}
      </InlineLinkText>
    </View>
  )
}

/** The publish date, like "July 30, 2026", and the reading time. */
function DocumentMeta({
  date,
  readingTime,
}: {
  /** An ISO datetime. Left out when missing or invalid. */
  date?: string
  /** In minutes. */
  readingTime?: number
}) {
  const {t: l, i18n} = useLingui()
  const t = useTheme()
  const parsed = date ? new Date(date) : undefined
  const hasDate = !!parsed && !Number.isNaN(parsed.getTime())
  if (!hasDate && !readingTime) return null

  return (
    <View style={[a.flex_row, a.align_center, a.gap_md, a.pt_2xs]}>
      {hasDate && (
        <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
          {i18n.date(parsed, {dateStyle: 'long'})}
        </Text>
      )}
      {!!readingTime && (
        <View
          accessible
          accessibilityLabel={l({
            message: `${readingTime} minute read`,
            comment: 'How long it takes to read an article, in minutes.',
          })}
          accessibilityHint=""
          style={[a.flex_row, a.align_center, a.gap_2xs]}>
          <ClockIcon size="xs" fill={t.atoms.text_contrast_medium.color} />
          <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
            {l({
              message: `${readingTime}m`,
              comment:
                'Abbreviated reading time of an article, in minutes, e.g. “12m”.',
            })}
          </Text>
        </View>
      )}
    </View>
  )
}
