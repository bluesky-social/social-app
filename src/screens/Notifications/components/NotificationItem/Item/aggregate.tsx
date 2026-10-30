import {type StyleProp, type TextStyle, View} from 'react-native'
import {moderatePost} from '@bsky/sdk/moderation'
import {RichText as RichTextAPI} from '@bsky/sdk/richtext'
import {Trans} from '@lingui/react/macro'

import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {atoms as a, useTheme} from '#/alf'
import {ArrowRight_Stroke2_Corner0_Rounded as ArrowRightIcon} from '#/components/icons/Arrow'
import {Link} from '#/components/Link'
import {ContentHider} from '#/components/moderation/ContentHider'
import {getEmbedThumbnails} from '#/components/Post/Embed/CompactMedia'
import {ExternalEmbed} from '#/components/Post/Embed/ExternalEmbed'
import {RichText} from '#/components/RichText'
import {Text} from '#/components/Typography'
import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'
import {RecordPreview} from './post'
import {getRowBorderColor, useItemContext} from './Root'

/**
 * A short preview of a post: its rich text, muted and ellipsized, and a
 * compact card for its link.
 *
 * Images, video and GIFs aren't previewed here, since rows show those as a
 * trailing `CompactMedia`. A post with nothing but a quote or a shared feed
 * shows that instead, as a compact quote or a feed card.
 */
export function PostPreview({
  post,
  style,
}: {
  post: app.bsky.feed.defs.PostView
  /**
   * Overrides the post text's style, e.g. its colour or size.
   */
  style?: StyleProp<TextStyle>
}) {
  const t = useTheme()
  const {isRead} = useItemContext()
  const moderationOpts = useModerationOpts()
  const record = bsky.isType(app.bsky.feed.post, post.record)
    ? post.record
    : undefined
  const hasThumbnails = getEmbedThumbnails(post.embed).length > 0
  const media = bsky.isType(app.bsky.embed.recordWithMedia.view, post.embed)
    ? post.embed.media
    : post.embed
  // GIF links have a thumbnail, so they trail the row instead
  const link =
    !hasThumbnails && bsky.isType(app.bsky.embed.external.view, media)
      ? media.external
      : undefined

  const text = record?.text.trim() ? (
    <RichText
      value={new RichTextAPI({text: record.text, facets: record.facets})}
      authorHandle={post.author.handle}
      numberOfLines={4}
      style={[a.text_sm, a.leading_snug, t.atoms.text_contrast_medium, style]}
      // Links and mentions would otherwise take the muted colour too
      interactiveStyle={t.atoms.text_link}
    />
  ) : null

  if (link) {
    const moderation = moderationOpts
      ? moderatePost(post, moderationOpts)
      : undefined
    return (
      <View style={[a.gap_sm]}>
        {text}
        <ContentHider modui={moderation?.ui('contentMedia')}>
          <ExternalEmbed
            link={link}
            post={post}
            presentation="compact"
            borderColor={getRowBorderColor(t, !isRead)}
          />
        </ContentHider>
      </View>
    )
  }
  if (text) return text
  if (hasThumbnails) return null

  if (bsky.isType(app.bsky.embed.record.view, post.embed)) {
    return <RecordPreview embed={post.embed} isMuted />
  }
  return null
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
