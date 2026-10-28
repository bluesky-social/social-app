import {memo, useImperativeHandle} from 'react'
import {Dimensions, type StyleProp, View, type ViewStyle} from 'react-native'
import {type RichText as RichTextType} from '@bsky/sdk/richtext'

import {useInitialNumToRender} from '#/lib/hooks/useInitialNumToRender'
import {type FeedDescriptor, type FeedParams} from '#/state/queries/post-feed'
import {List, type ListRef} from '#/view/com/util/List'
import {IS_IOS} from '#/env'
import {type app} from '#/lexicons'
import {type PostFeedRef, usePostFeedModel} from './usePostFeedModel'

export {
  type FeedRow,
  getItemsForFeedback,
  isThreadChildAt,
  isThreadParentAt,
  type PostFeedModel,
  type PostFeedRef,
} from './usePostFeedModel'

/**
 * A feed on a screen of its own: the whole screen is the list.
 *
 * Screens that scroll a feed along with their own content (a profile, whose
 * header and tabs go up with the posts) take `usePostFeedModel` instead and
 * render the rows in their own list, so that only one scroll view exists.
 */
let PostFeed = ({
  feed,
  description,
  feedParams,
  ignoreFilterFor,
  style,
  enabled,
  pollInterval,
  disablePoll,
  scrollElRef,
  onScrolledDownChange,
  onHasNew,
  renderEmptyState,
  renderEndOfFeed,
  testID,
  headerOffset = 0,
  progressViewOffset,
  desktopFixedHeightOffset,
  ListHeaderComponent,
  extraData,
  savedFeedConfig,
  initialNumToRender: initialNumToRenderOverride,
  isVideoFeed = false,
  ref,
}: {
  feed: FeedDescriptor
  description?: RichTextType
  feedParams?: FeedParams
  ignoreFilterFor?: string
  style?: StyleProp<ViewStyle>
  enabled?: boolean
  pollInterval?: number
  disablePoll?: boolean
  scrollElRef?: ListRef
  onHasNew?: (v: boolean) => void
  onScrolledDownChange?: (isScrolledDown: boolean) => void
  renderEmptyState: () => React.ReactElement
  renderEndOfFeed?: () => React.ReactElement
  testID?: string
  headerOffset?: number
  progressViewOffset?: number
  desktopFixedHeightOffset?: number
  ListHeaderComponent?: () => React.ReactElement
  extraData?: Record<string, unknown>
  savedFeedConfig?: app.bsky.actor.defs.SavedFeed
  initialNumToRender?: number
  isVideoFeed?: boolean
  lastFetchDate?: () => number
  ref?: React.Ref<PostFeedRef>
}): React.ReactNode => {
  const initialNumToRender = useInitialNumToRender()
  const model = usePostFeedModel({
    feed,
    description,
    feedParams,
    ignoreFilterFor,
    enabled,
    pollInterval,
    disablePoll,
    onHasNew,
    onScrolledDownChange,
    renderEmptyState,
    renderEndOfFeed,
    headerOffset,
    savedFeedConfig,
    isVideoFeed,
  })

  useImperativeHandle(ref, () => ({
    refreshFeed: model.refreshFeed,
  }))

  return (
    <View testID={testID} style={style}>
      <List
        testID={testID ? `${testID}-flatlist` : undefined}
        ref={scrollElRef}
        data={model.rows}
        keyExtractor={model.keyExtractor}
        renderItem={model.renderItem}
        ListFooterComponent={model.ListFooterComponent}
        ListHeaderComponent={ListHeaderComponent}
        refreshing={model.refreshing}
        onRefresh={model.onRefresh}
        headerOffset={headerOffset}
        progressViewOffset={progressViewOffset}
        contentContainerStyle={{
          minHeight: Dimensions.get('window').height * 1.5,
        }}
        onScrolledDownChange={model.onScrolledDownChange}
        onEndReached={model.onEndReached}
        onEndReachedThreshold={2} // number of posts left to trigger load more
        removeClippedSubviews={true}
        extraData={extraData}
        desktopFixedHeight={
          desktopFixedHeightOffset ? desktopFixedHeightOffset : true
        }
        initialNumToRender={initialNumToRenderOverride ?? initialNumToRender}
        windowSize={9}
        maxToRenderPerBatch={IS_IOS ? 5 : 1}
        updateCellsBatchingPeriod={40}
        onItemSeen={model.onItemSeen}
      />
    </View>
  )
}
PostFeed = memo(PostFeed)
export {PostFeed}
