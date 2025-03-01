import {StyleSheet} from 'react-native'

import {usePalette} from '#/lib/hooks/usePalette'
import {FeedSourceCard} from '#/view/com/feeds/FeedSourceCard'
import {EmbedType} from '#/types/bsky/post'
import {CommonProps} from './types'

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

const styles = StyleSheet.create({
  customFeedOuter: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
})
