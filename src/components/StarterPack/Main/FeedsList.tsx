import React, {useCallback} from 'react'
import {type ListRenderItemInfo, View} from 'react-native'
import {type AppBskyFeedDefs} from '@atproto/api'

import {useBottomBarOffset} from '#/lib/hooks/useBottomBarOffset'
import {isNative, isWeb} from '#/platform/detection'
import {List, type ListRef} from '#/view/com/util/List'
import {type SectionRef} from '#/screens/Profile/Sections/types'
import {atoms as a, useTheme} from '#/alf'
import * as FeedCard from '#/components/FeedCard'

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
    const t = useTheme()

    const onScrollToTop = useCallback(() => {
      scrollElRef.current?.scrollToOffset({
        animated: isNative,
        offset: -headerHeight,
      })
    }, [scrollElRef, headerHeight])

    React.useImperativeHandle(ref, () => ({
      scrollToTop: onScrollToTop,
    }))

    const renderItem = ({
      item,
      index,
    }: ListRenderItemInfo<AppBskyFeedDefs.GeneratorView>) => {
      return (
        <View
          style={[
            a.p_lg,
            (isWeb || index !== 0) && a.border_t,
            t.atoms.border_contrast_low,
          ]}>
          <FeedCard.Default view={item} />
        </View>
      )
    }

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
