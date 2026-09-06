import {type ViewStyle} from 'react-native'
import {StyleProp} from 'react-native'
import {AtUri} from '@atproto/syntax'
import {moderateProfile} from '@bsky/sdk/moderation'
import {Trans, useLingui} from '@lingui/react/macro'

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
  outerStyle,
}: {
  post: app.bsky.feed.defs.PostView
  feature: Features
  outerStyle?: StyleProp<ViewStyle>
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const moderationOpts = useModerationOpts()
  const ax = useAnalytics()

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
    names.length >= 2
      ? l`Liked by ${names[0].displayName} and ${names[1].displayName}`
      : l`Liked by ${names[0].displayName}`
  const textStyle = [a.text_sm, t.atoms.text_contrast_medium]
  const nameStyle = [a.text_sm, a.font_medium, t.atoms.text_contrast_medium]

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
    <Link
      to={likesHref}
      label={rowLabel}
      style={[
        a.w_full,
        a.flex_row,
        a.align_center,
        a.gap_xs,
        a.flex_shrink,
        outerStyle,
      ]}
      onPress={() => ax.metric('post:likedBy:click', {})}>
      <AvatarStack
        profiles={aviStackProfiles}
        size={16}
        overlap={4}
        borderWidth={0.5}
        backgroundColor={t.atoms.bg_contrast_25.backgroundColor}
      />
      <Text testID="knownLikersStat" style={[a.flex_shrink, textStyle]}>
        {names.length >= 2 ? (
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
  )
}
