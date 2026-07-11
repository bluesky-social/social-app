import {View} from 'react-native'
import {type AppBskyFeedDefs, AtUri, moderateProfile} from '@atproto/api'
import {plural} from '@lingui/core/macro'
import {Plural, Trans, useLingui} from '@lingui/react/macro'

import {makeProfileLink} from '#/lib/routes/links'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useLikedBySampleQuery} from '#/state/queries/post-liked-by'
import {useSession} from '#/state/session'
import {atoms as a, useTheme} from '#/alf'
import {AvatarStack} from '#/components/AvatarStack'
import {InlineLinkText, Link} from '#/components/Link'
import {useFormatPostStatCount} from '#/components/PostControls/util'
import {ProfileHoverCard} from '#/components/ProfileHoverCard'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'

const AVI_SIZE = 20

/**
 * The likes stat for the expanded anchor post. When the viewer follows some
 * of the post's recent likers, renders social proof - a face pile plus
 * "Liked by A, B, and N others" - in place of the plain "N likes" text,
 * which it falls back to otherwise.
 *
 * Known likers are sourced client-side from a single `getLikes` request (100
 * likes, the API max per page), so they are a sample of the most recent
 * likers, not an exhaustive list. Only the faces and names are affected by
 * sampling - the "N others" count is derived from the post's total like
 * count.
 */
export function LikesStat({post}: {post: AppBskyFeedDefs.PostView}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const {hasSession, currentAccount} = useSession()
  const moderationOpts = useModerationOpts()
  const formatPostStatCount = useFormatPostStatCount()
  const ax = useAnalytics()

  const likeCount = post.likeCount ?? 0
  /*
   * Kill switch for the getLikes sample request itself, separate from the
   * display gate below.
   */
  const fetchEnabled = ax.features.enabled(
    ax.features.PostThreadKnownLikersFetchEnable,
  )
  const {data} = useLikedBySampleQuery({
    uri: fetchEnabled && hasSession && likeCount > 0 ? post.uri : undefined,
  })

  if (likeCount === 0) return null

  const urip = new AtUri(post.uri)
  const likesHref = makeProfileLink(post.author, 'post', urip.rkey, 'liked-by')

  const knownLikers = moderationOpts
    ? (data?.likes ?? [])
        .map(like => like.actor)
        .filter(
          actor =>
            actor.did !== currentAccount?.did &&
            actor.viewer?.following &&
            !actor.viewer.muted &&
            !actor.viewer.blocking &&
            !actor.viewer.blockedBy,
        )
    : []

  const showKnownLikers =
    knownLikers.length > 0 &&
    ax.features.enabled(ax.features.PostThreadKnownLikersEnable)

  if (!showKnownLikers) {
    return (
      <Link to={likesHref} label={l`Likes on this post`}>
        <Text
          testID="likeCount-expanded"
          style={[a.text_md, t.atoms.text_contrast_medium]}>
          <Trans comment="Like count display, the <0> tags enclose the number of likes in bold (will never be 0)">
            <Text style={[a.text_md, a.font_semi_bold, t.atoms.text]}>
              {formatPostStatCount(likeCount)}
            </Text>{' '}
            <Plural value={likeCount} one="like" other="likes" />
          </Trans>
        </Text>
      </Link>
    )
  }

  const names = knownLikers.slice(0, 2).map(actor => {
    const moderation = moderateProfile(actor, moderationOpts!)
    return {
      did: actor.did,
      href: makeProfileLink(actor),
      displayName: sanitizeDisplayName(
        actor.displayName || actor.handle,
        moderation.ui('displayName'),
      ),
    }
  })
  const others = likeCount - names.length

  /*
   * The row link's a11y label mirrors the visible sentence so screen readers
   * announce the social proof.
   */
  const othersLabel = plural(others, {
    one: `${formatPostStatCount(others)} other`,
    other: `${formatPostStatCount(others)} others`,
  })
  const rowLabel =
    names.length >= 2
      ? others > 0
        ? l`${names[0].displayName}, ${names[1].displayName}, and ${othersLabel} like this`
        : l`${names[0].displayName} and ${names[1].displayName} like this`
      : others > 0
        ? l`${names[0].displayName} and ${othersLabel} like this`
        : l`${names[0].displayName} likes this`

  const textStyle = [a.text_md, t.atoms.text_contrast_medium]
  const nameStyle = [a.text_md, a.font_semi_bold, t.atoms.text]

  /*
   * Nested inside the row link, but the deepest link claims the press, so
   * tapping a name goes to that profile while the rest of the row goes to
   * the likes list. Same pattern as NotificationFeedItem's author links.
   */
  const nameLink = (name: (typeof names)[number]) => (
    <ProfileHoverCard key={name.did} did={name.did} inline>
      <InlineLinkText
        to={name.href}
        label={l`Go to ${name.displayName}'s profile`}
        disableMismatchWarning
        emoji
        style={nameStyle}>
        {name.displayName}
      </InlineLinkText>
    </ProfileHoverCard>
  )

  return (
    /*
     * The full-width wrapper keeps the social proof on its own line within
     * the wrapping stats row, rather than wrapping mid-row and orphaning
     * whichever count stat comes last. The link itself hugs its content so
     * the empty space to the right of the text is not pressable.
     */
    <View style={[a.w_full, a.flex_row]}>
      <Link
        to={likesHref}
        label={rowLabel}
        style={[a.flex_row, a.align_center, a.gap_sm, a.flex_shrink]}>
        <AvatarStack profiles={knownLikers.slice(0, 3)} size={AVI_SIZE} />
        <Text
          testID="knownLikersStat"
          numberOfLines={1}
          style={[a.flex_shrink, textStyle]}>
          {names.length >= 2 ? (
            others > 0 ? (
              <Trans comment="Social proof on the likes stat; the bolded names are people the viewer follows who liked the post, and the count is the remaining number of likes">
                {nameLink(names[0])}, {nameLink(names[1])}, and{' '}
                <Plural
                  value={others}
                  one={`${formatPostStatCount(others)} other`}
                  other={`${formatPostStatCount(others)} others`}
                />{' '}
                like this
              </Trans>
            ) : (
              <Trans comment="Social proof on the likes stat; the bolded names are people the viewer follows who liked the post and are its only likes">
                {nameLink(names[0])} and {nameLink(names[1])} like this
              </Trans>
            )
          ) : others > 0 ? (
            <Trans comment="Social proof on the likes stat; the bolded name is a person the viewer follows who liked the post, and the count is the remaining number of likes">
              {nameLink(names[0])} and{' '}
              <Plural
                value={others}
                one={`${formatPostStatCount(others)} other`}
                other={`${formatPostStatCount(others)} others`}
              />{' '}
              like this
            </Trans>
          ) : (
            <Trans comment="Social proof on the likes stat; the bolded name is a person the viewer follows who liked the post and is its only like">
              {nameLink(names[0])} likes this
            </Trans>
          )}
        </Text>
      </Link>
    </View>
  )
}
