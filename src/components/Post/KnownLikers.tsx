import {View} from 'react-native'
import {AtUri} from '@atproto/syntax'
import {moderateProfile} from '@bsky/sdk/moderation'
import {Plural, Trans, useLingui} from '@lingui/react/macro'

import {makeProfileLink} from '#/lib/routes/links'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {atoms as a, useTheme} from '#/alf'
import {AvatarStack} from '#/components/AvatarStack'
import {InlineLinkText, Link} from '#/components/Link'
import {ProfileHoverCard} from '#/components/ProfileHoverCard'
import {Text} from '#/components/Typography'
import {type Features, useAnalytics} from '#/analytics'
import {type app} from '#/lexicons'

/**
 * Social proof for a post. When the viewer follows some of the post's recent
 * likers, renders a face pile plus "Liked by A and B". Renders nothing when
 * the feature is disabled or no visible known likers are available.
 */
export function KnownLikers({
  post,
  feature,
  variant = 'thread',
}: {
  post: app.bsky.feed.defs.PostView
  feature: Features
  variant?: 'feed' | 'thread'
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const moderationOpts = useModerationOpts()
  const ax = useAnalytics()

  const likeCount = post.likeCount ?? 0
  if (likeCount === 0) return null

  const knownLikersAndModeration = moderationOpts
    ? (post.viewer?.knownLikers?.actors ?? [])
        .map(actor => ({
          actor,
          moderation: moderateProfile(actor, moderationOpts),
        }))
        .filter(({moderation}) => !moderation.ui('profileList').filter)
    : []

  if (knownLikersAndModeration.length === 0 || !ax.features.enabled(feature)) {
    return null
  }

  const urip = new AtUri(post.uri)
  const likesHref = makeProfileLink(post.author, 'post', urip.rkey, 'liked-by')
  const aviStackProfiles = knownLikersAndModeration
    .slice(0, 3)
    .map(({actor}) => actor)
  const names = knownLikersAndModeration
    .slice(0, 2)
    .map(({actor, moderation}) => ({
      did: actor.did,
      href: makeProfileLink(actor),
      displayName: sanitizeDisplayName(
        actor.displayName || actor.handle,
        moderation.ui('displayName'),
      ),
    }))
  const rowLabel =
    variant === 'feed'
      ? likeCount > 1
        ? l`${names[0].displayName} and ${likeCount - 1} others liked this`
        : l`${names[0].displayName} liked this`
      : names.length >= 2
        ? l`Liked by ${names[0].displayName} and ${names[1].displayName}`
        : l`Liked by ${names[0].displayName}`
  const textStyle = [
    variant === 'feed' ? a.text_xs : a.text_sm,
    t.atoms.text_contrast_medium,
  ]
  const nameStyle = [a.text_sm, a.font_semi_bold, t.atoms.text]

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
    <View style={[a.w_full, a.flex_row]}>
      <Link
        to={likesHref}
        label={rowLabel}
        style={[
          a.flex_row,
          a.align_center,
          variant === 'feed' ? a.gap_xs : a.gap_sm,
          a.flex_shrink,
        ]}
        onPress={() => ax.metric('post:likedBy:click', {})}>
        <AvatarStack
          profiles={aviStackProfiles}
          size={variant === 'feed' ? 16 : 20}
        />
        <Text testID="knownLikersStat" style={[a.flex_shrink, textStyle]}>
          {variant === 'feed' ? (
            likeCount > 1 ? (
              <Trans comment="Social proof below a feed post; a person the viewer follows and the number of other people who liked the post">
                {names[0].displayName} and{' '}
                <Plural value={likeCount - 1} one="1 other" other="# others" />{' '}
                liked this
              </Trans>
            ) : (
              <Trans comment="Social proof below a feed post; a person the viewer follows who liked the post">
                {names[0].displayName} liked this
              </Trans>
            )
          ) : names.length >= 2 ? (
            <Trans comment="Social proof below a post; the bolded names are people the viewer follows who liked the post">
              Liked by {nameLink(names[0])} and {nameLink(names[1])}
            </Trans>
          ) : (
            <Trans comment="Social proof below a post; the bolded name is a person the viewer follows who liked the post">
              Liked by {nameLink(names[0])}
            </Trans>
          )}
        </Text>
      </Link>
    </View>
  )
}
