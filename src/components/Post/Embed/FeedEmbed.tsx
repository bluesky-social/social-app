import React from 'react'
import {StyleSheet} from 'react-native'
import {moderateFeedGenerator} from '@atproto/api'

import {usePalette} from '#/lib/hooks/usePalette'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {FeedSourceCard} from '#/view/com/feeds/FeedSourceCard'
import {ContentHider} from '#/components/moderation/ContentHider'
import {type EmbedType} from '#/types/bsky/post'
import {type CommonProps} from './types'

export function FeedEmbed({
  embed,
}: CommonProps & {
  embed: EmbedType<'feed'>
}) {
  const pal = usePalette('default')
  return (
    <FeedSourceCard
      feedUri={embed.view.uri}
      style={[pal.view, pal.border, styles.customFeedOuter]}
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

const styles = StyleSheet.create({
  customFeedOuter: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
})
