import React, {useCallback} from 'react'
import {ListRenderItemInfo, View} from 'react-native'
import {AppBskyFeedDefs} from '@atproto/api'
import {GeneratorView} from '@atproto/api/dist/client/types/app/bsky/feed/defs'

import {useBottomBarOffset} from 'lib/hooks/useBottomBarOffset'
import {isNative} from 'platform/detection'
import {FeedSourceCard} from 'view/com/feeds/FeedSourceCard'
import {List, ListRef} from 'view/com/util/List'
import {SectionRef} from '#/screens/Profile/Sections/types'

function renderItem({item, index}: ListRenderItemInfo<GeneratorView>) {
  return (
    <FeedSourceCard
      feedUri={item.uri}
      hideTopBorder={isNative && index === 0}
    />
  )
}

function keyExtractor(item: AppBskyFeedDefs.GeneratorView) {
  return item.uri
}

interface ProfilesListProps {
  feeds: AppBskyFeedDefs.GeneratorView[]
  headerHeight: number
  scrollElRef: ListRef
}

export const FeedsList = React.forwardRef<SectionRef, ProfilesListProps>(
  function FeedsListImpl({feeds, headerHeight, scrollElRef}, ref) {
    const [initialHeaderHeight] = React.useState(headerHeight)
    const bottomBarOffset = useBottomBarOffset(20)

    const onScrollToTop = useCallback(() => {
      scrollElRef.current?.scrollToOffset({
        animated: isNative,
        offset: -headerHeight,
      })
    }, [scrollElRef, headerHeight])

    React.useImperativeHandle(ref, () => ({
      scrollToTop: onScrollToTop,
    }))

    return (
      <List
        data={feeds}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ref={scrollElRef}
        headerOffset={headerHeight}
        ListFooterComponent={
          <View style={[{height: initialHeaderHeight + bottomBarOffset}]} />
        }
        showsVerticalScrollIndicator={false}
        desktopFixedHeight={true}
      />
    )
  },
)
