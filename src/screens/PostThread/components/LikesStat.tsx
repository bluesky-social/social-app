import {View} from 'react-native'
import {type AppBskyFeedDefs, AtUri, moderateProfile} from '@atproto/api'
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
 * The plain "N likes" stat for the expanded anchor post, linking to the likes
 * list. Renders nothing when the post has no likes.
 */
export function LikesStat({post}: {post: AppBskyFeedDefs.PostView}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const formatPostStatCount = useFormatPostStatCount()
  const ax = useAnalytics()

  const likeCount = post.likeCount ?? 0
  if (likeCount === 0) return null

  const urip = new AtUri(post.uri)
  const likesHref = makeProfileLink(post.author, 'post', urip.rkey, 'liked-by')

  return (
    <Link
      to={likesHref}
      label={l`Likes on this post`}
      onPress={() => ax.metric('post:likedBy:click', {})}>
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

/**
 * Social proof for the expanded anchor post. When the viewer follows some of
 * the post's recent likers, renders a face pile plus "Liked by A and B" on
 * its own row below the interaction stats line. Renders nothing otherwise.
 *
 * Known likers are sourced client-side from a single `getLikes` request (100
 * likes, the API max per page), so they are a sample of the most recent
 * likers, not an exhaustive list.
 */
export function KnownLikers({post}: {post: AppBskyFeedDefs.PostView}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const {hasSession, currentAccount} = useSession()
  const moderationOpts = useModerationOpts()
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
  const onPressLikedBy = () => ax.metric('post:likedBy:click', {})

  const knownLikersAndModeration = moderationOpts
    ? (data?.likes ?? [])
        .map(like => like.actor)
        .map(actor => ({
          actor,
          moderation: moderateProfile(actor, moderationOpts),
        }))
        .filter(({actor, moderation}) => {
          const modui = moderation.ui('profileList')
          const isMe = actor.did === currentAccount?.did
          const following = actor.viewer?.following
          return !isMe && following && !modui.filter
        })
    : []

  const showKnownLikers =
    knownLikersAndModeration.length > 0 &&
    ax.features.enabled(ax.features.PostThreadKnownLikersEnable)

  if (!showKnownLikers) return null

  const aviStackProfiles = knownLikersAndModeration
    .slice(0, 3)
    .map(({actor}) => actor)
  const names = knownLikersAndModeration
    .slice(0, 2)
    .map(({actor, moderation}) => {
      return {
        did: actor.did,
        href: makeProfileLink(actor),
        displayName: sanitizeDisplayName(
          actor.displayName || actor.handle,
          moderation.ui('displayName'),
        ),
      }
    })
  /*
   * The row link's a11y label mirrors the visible sentence so screen readers
   * announce the social proof.
   */
  const rowLabel =
    names.length >= 2
      ? l`Liked by ${names[0].displayName} and ${names[1].displayName}`
      : l`Liked by ${names[0].displayName}`

  const textStyle = [a.text_sm, t.atoms.text_contrast_medium]
  const nameStyle = [a.text_sm, a.font_semi_bold, t.atoms.text]

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
     * The full-width wrapper forces the social proof onto its own line below
     * the count stats within the wrapping stats row.
     */
    <View style={[a.w_full, a.flex_row]}>
      <Link
        to={likesHref}
        label={rowLabel}
        style={[a.flex_row, a.align_center, a.gap_sm, a.flex_shrink]}
        onPress={onPressLikedBy}>
        <AvatarStack profiles={aviStackProfiles} size={AVI_SIZE} />
        <Text testID="knownLikersStat" style={[a.flex_shrink, textStyle]}>
          {names.length >= 2 ? (
            <Trans comment="Social proof below the post stats; the bolded names are people the viewer follows who liked the post">
              Liked by {nameLink(names[0])} and {nameLink(names[1])}
            </Trans>
          ) : (
            <Trans comment="Social proof below the post stats; the bolded name is a person the viewer follows who liked the post">
              Liked by {nameLink(names[0])}
            </Trans>
          )}
        </Text>
      </Link>
    </View>
  )
}
