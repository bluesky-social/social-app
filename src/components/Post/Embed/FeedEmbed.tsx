import React from 'react'
import {moderateFeedGenerator} from '@atproto/api'

import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {FeedSourceCard} from '#/view/com/feeds/FeedSourceCard'
import {atoms as a, useTheme} from '#/alf'
import {ContentHider} from '#/components/moderation/ContentHider'
import {type EmbedType} from '#/types/bsky/post'
import {type CommonProps} from './types'

export function FeedEmbed({
  embed,
}: CommonProps & {
  embed: EmbedType<'feed'>
}) {
  const t = useTheme()
  return (
    <FeedSourceCard
      feedUri={embed.view.uri}
      feedData={embed.view}
      style={[
        t.atoms.bg,
        t.atoms.border_contrast_low,
        a.p_md,
        a.rounded_sm,
        a.border,
      ]}
      showLikes
    />
  )
}

export function ModeratedFeedEmbed({
  embed,
}: CommonProps & {
  embed: EmbedType<'feed'>
}) {
  const moderationOpts = useModerationOpts()
  const moderation = React.useMemo(() => {
    return moderationOpts
      ? moderateFeedGenerator(embed.view, moderationOpts)
      : undefined
  }, [embed.view, moderationOpts])
  return (
    <ContentHider modui={moderation?.ui('contentList')}>
      <FeedEmbed embed={embed} />
    </ContentHider>
  )
}
