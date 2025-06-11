import React from 'react'
import {StyleSheet, View} from 'react-native'
import {
  type AppBskyFeedDefs,
  type AppBskyGraphDefs,
  moderateFeedGenerator,
  moderateUserList,
} from '@atproto/api'

import {usePalette} from '#/lib/hooks/usePalette'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {FeedSourceCard} from '#/view/com/feeds/FeedSourceCard'
import {atoms as a, useTheme} from '#/alf'
import * as ListCard from '#/components/ListCard'
import {ContentHider} from '../../../../components/moderation/ContentHider'

export function MaybeFeedCard({view}: {view: AppBskyFeedDefs.GeneratorView}) {
  const pal = usePalette('default')
  const moderationOpts = useModerationOpts()
  const moderation = React.useMemo(() => {
    return moderationOpts
      ? moderateFeedGenerator(view, moderationOpts)
      : undefined
  }, [view, moderationOpts])

  return (
    <ContentHider modui={moderation?.ui('contentList')}>
      <FeedSourceCard
        feedUri={view.uri}
        style={[pal.view, pal.border, styles.customFeedOuter]}
        showLikes
      />
    </ContentHider>
  )
}

export function MaybeListCard({view}: {view: AppBskyGraphDefs.ListView}) {
  const moderationOpts = useModerationOpts()
  const moderation = React.useMemo(() => {
    return moderationOpts ? moderateUserList(view, moderationOpts) : undefined
  }, [view, moderationOpts])
  const t = useTheme()

  return (
    <ContentHider modui={moderation?.ui('contentList')}>
      <View
        style={[
          a.border,
          t.atoms.border_contrast_medium,
          a.p_md,
          a.rounded_sm,
        ]}>
        <ListCard.Default view={view} />
      </View>
    </ContentHider>
  )
}

const styles = StyleSheet.create({
  altContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    position: 'absolute',
    right: 6,
    bottom: 6,
  },
  alt: {
    color: 'white',
    fontSize: 7,
    fontWeight: '600',
  },
  customFeedOuter: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
})
