import {type StyleProp, type TextStyle} from 'react-native'
import {RichText as RichTextAPI} from '@bsky/sdk/richtext'
import {Trans, useLingui} from '@lingui/react/macro'

import {toNiceDomain} from '#/lib/strings/url-helpers'
import {atoms as a, useTheme} from '#/alf'
import {ArrowRight_Stroke2_Corner0_Rounded as ArrowRightIcon} from '#/components/icons/Arrow'
import {Link} from '#/components/Link'
import {RichText} from '#/components/RichText'
import {Text} from '#/components/Typography'
import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'
import {getPostThumbnails} from './media'
import {QuoteCard} from './post'
import {SecondaryText} from './text'

/**
 * A short preview of a post's rich text, muted and ellipsized.
 *
 * Posts without text render nothing if they have images or video, since rows
 * show those as a trailing `Item.InlineImages`. One that only quotes another
 * post shows the quoted post instead. Otherwise this says what the post
 * contains, e.g. "Link to nytimes.com".
 */
export function PostPreview({
  post,
  style,
}: {
  post: app.bsky.feed.defs.PostView
  /**
   * Overrides the post text's style, e.g. its colour or size. The textless
   * fallback's colour stays muted regardless.
   */
  style?: StyleProp<TextStyle>
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const record = bsky.isType(app.bsky.feed.post, post.record)
    ? post.record
    : undefined

  if (record?.text.trim()) {
    return (
      <RichText
        value={new RichTextAPI({text: record.text, facets: record.facets})}
        authorHandle={post.author.handle}
        numberOfLines={4}
        style={[a.text_sm, a.leading_snug, t.atoms.text_contrast_medium, style]}
        // Links and mentions would otherwise take the muted colour too
        interactiveStyle={t.atoms.text_link}
      />
    )
  }

  if (getPostThumbnails(post.embed).length > 0) return null

  const embed = getTextlessEmbed(post.embed)
  if (!embed) return null

  if (embed.type === 'quote') {
    return <QuoteCard embed={embed.record} numberOfLines={4} isMuted />
  }

  const domain = embed.domain
  return (
    <SecondaryText
      numberOfLines={1}
      style={[a.text_sm, style, t.atoms.text_contrast_medium]}>
      {l`Link to ${domain}`}
    </SecondaryText>
  )
}

/**
 * What a post without text or media contains, for `PostPreview`'s fallback.
 */
function getTextlessEmbed(
  embed: app.bsky.feed.defs.PostView['embed'],
):
  | {type: 'link'; domain: string}
  | {type: 'quote'; record: app.bsky.embed.record.View}
  | undefined {
  const media = bsky.isType(app.bsky.embed.recordWithMedia.view, embed)
    ? embed.media
    : embed

  if (bsky.isType(app.bsky.embed.external.view, media)) {
    return {type: 'link', domain: toNiceDomain(media.external.uri)}
  }
  if (bsky.isType(app.bsky.embed.record.view, embed)) {
    return {type: 'quote', record: embed}
  }
  if (bsky.isType(app.bsky.embed.recordWithMedia.view, embed)) {
    return {type: 'quote', record: embed.record}
  }
  return undefined
}

/**
 * A "View all ->" link, for rows that summarise more than they can show.
 */
export function ViewAllLink({
  href,
  label,
}: {
  href: string
  /**
   * Accessibility label saying what "all" is, e.g. "View all posts liked by
   * alice".
   */
  label: string
}) {
  const t = useTheme()

  return (
    <Link to={href} label={label} style={[a.self_start, a.gap_xs]}>
      {({hovered}) => (
        <>
          <Text
            style={[
              a.text_md,
              a.leading_snug,
              a.font_medium,
              {color: t.palette.primary_500},
              hovered && a.underline,
            ]}>
            <Trans>View all</Trans>
          </Text>
          <ArrowRightIcon size="xs" fill={t.palette.primary_500} />
        </>
      )}
    </Link>
  )
}
