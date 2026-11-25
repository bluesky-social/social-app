import {type StyleProp, View, type ViewStyle} from 'react-native'
import {Image} from 'expo-image'
import {plural} from '@lingui/core/macro'
import {Trans, useLingui} from '@lingui/react/macro'

import {useHaptics} from '#/lib/haptics'
import {makeProfileLink} from '#/lib/routes/links'
import {shareUrl} from '#/lib/sharing'
import {sanitizeHandle} from '#/lib/strings/handles'
import {toNiceDomain} from '#/lib/strings/url-helpers'
import {AtmosphereCardMenu} from '#/screens/Atmosphere/components/AtmosphereCardMenu'
import {getAssociatedProfile} from '#/screens/Atmosphere/data/exploreData'
import {atoms as a, useTheme} from '#/alf'
import {KnownLikers} from '#/components/atmosphere/KnownLikers'
import {LikeButton} from '#/components/atmosphere/LikeButton'
import {MetaLine} from '#/components/atmosphere/MetaLine'
import {PublicationIcon} from '#/components/atmosphere/SiteStandard/PublicationIcon'
import type * as ssTypes from '#/components/atmosphere/SiteStandard/types'
import {InlineLinkText, Link} from '#/components/Link'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {IS_NATIVE} from '#/env'
import {type app, site} from '#/lexicons'

const THUMBNAIL_SIZE = 80

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

/**
 * An article card: its publication, image, title, details and description,
 * then a recommend button, known recommenders and a menu. Only the image and
 * title open the article, leaving the rest free for other actions.
 */
export function Document({
  view,
  variant = 'default',
  recommenders,
  onPressCallback,
  onShareCallback,
  style,
}: ssTypes.PublicApiProps & {
  view: app.bsky.embed.external.ViewArticle
  /**
   * `default` shows the image full width above the title; `compact` shows it
   * as a thumbnail beside the title.
   */
  variant?: 'default' | 'compact'
  /** Shown ahead of the view's `knownLikers`. */
  recommenders?: DocumentRecommenders
  style?: StyleProp<ViewStyle>
}) {
  const ax = useAnalytics()
  const {t: l} = useLingui()
  const t = useTheme()
  const haptics = useHaptics()
  const author = getAssociatedProfile(view.associatedProfiles)
  const label = view.title || l`Open link to ${toNiceDomain(view.uri)}`

  const linkProps = {
    to: view.uri,
    shouldProxy: true,
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
    />
  )

  return (
    <View
      testID="document"
      style={[
        a.w_full,
        a.overflow_hidden,
        a.rounded_lg,
        a.border,
        t.atoms.bg,
        t.atoms.border_contrast_low,
        style,
      ]}>
      {view.publisher && (
        <PublicationHeader publication={view.publisher} author={author} />
      )}
      {variant === 'default' && image && (
        <Link
          {...linkProps}
          testID="documentImage"
          label={label}
          style={[a.w_full, a.aspect_card, t.atoms.bg_contrast_25]}>
          {image}
        </Link>
      )}
      <View style={[a.flex_row, a.align_start, a.gap_md, a.px_md, a.pt_md]}>
        <View style={[a.flex_1, a.gap_xs]}>
          {!!view.title && (
            <InlineLinkText
              {...linkProps}
              testID="documentTitle"
              label={label}
              emoji
              numberOfLines={3}
              style={[
                a.text_xl,
                a.font_bold,
                a.leading_snug,
                t.atoms.text,
                a.pb_xs,
              ]}>
              {view.title}
            </InlineLinkText>
          )}
          <MetaLine
            date={view.createdAt}
            details={[
              !!view.readingTime &&
                l({
                  message: plural(view.readingTime, {
                    one: '# min read',
                    other: '# min read',
                  }),
                  comment:
                    'How long it takes to read an article, in minutes, e.g. “5 min read”.',
                }),
              toNiceDomain(view.uri),
            ]}
          />
          {!!view.description.trim() && (
            <Text
              emoji
              numberOfLines={3}
              style={[
                a.pt_xs,
                a.text_sm,
                a.leading_snug,
                t.atoms.text_contrast_high,
              ]}>
              {view.description}
            </Text>
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
              {width: THUMBNAIL_SIZE, height: THUMBNAIL_SIZE},
            ]}>
            {image}
          </Link>
        )}
      </View>
      <View style={[a.flex_row, a.align_center, a.gap_xs, a.px_md, a.py_sm]}>
        <LikeButton view={view} kind="recommend" testID="documentRecommend" />
        <KnownLikers view={view} leadingProfiles={recommenders?.actors} />
        <View style={a.flex_1} />
        <AtmosphereCardMenu
          inline
          type="article"
          item={view}
          reportableTypes={[site.standard.document.$type]}
          author={author}
        />
      </View>
    </View>
  )
}

/**
 * The publication's icon and name, which opens the publication, and the
 * author's handle, which opens their profile.
 */
function PublicationHeader({
  publication,
  author,
}: {
  publication: app.bsky.embed.external.ViewArticlePublication
  author?: app.bsky.actor.defs.ProfileViewBasic
}) {
  const {t: l} = useLingui()
  const t = useTheme()
  const handle = author && sanitizeHandle(author.handle, '@')

  return (
    <View
      style={[
        a.flex_row,
        a.align_center,
        a.gap_sm,
        a.px_md,
        a.py_sm,
        t.atoms.bg_contrast_25,
      ]}>
      <PublicationIcon view={publication} size={32} />
      <View style={[a.flex_1, a.gap_2xs]}>
        <InlineLinkText
          testID="documentPublication"
          to={publication.uri}
          shouldProxy
          label={l({
            message: `Open publication: ${publication.title}`,
            comment:
              'Accessibility label for a link to the publication an article was published in. {title} is its name, written by its author.',
          })}
          emoji
          numberOfLines={1}
          style={[a.text_xs, a.font_bold, a.leading_tight, t.atoms.text]}>
          {publication.title}
        </InlineLinkText>
        {author && handle && (
          <Text
            numberOfLines={1}
            style={[a.text_xs, a.leading_tight, t.atoms.text_contrast_medium]}>
            <Trans comment="Under the name of the publication an article was published in. The handle links to the author's profile.">
              by{' '}
              <InlineLinkText
                testID="documentAuthor"
                to={makeProfileLink(author)}
                label={l`View profile of ${handle}`}
                style={[
                  a.text_xs,
                  a.leading_tight,
                  t.atoms.text_contrast_medium,
                ]}>
                {handle}
              </InlineLinkText>
            </Trans>
          </Text>
        )}
      </View>
    </View>
  )
}
