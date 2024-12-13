import React, {useCallback} from 'react'
import {View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {isNative} from '#/platform/detection'
import {FeedDescriptor} from '#/state/queries/post-feed'
import {PostFeed} from '#/view/com/posts/PostFeed'
import {EmptyState} from '#/view/com/util/EmptyState'
import {ListRef} from '#/view/com/util/List'
import {SectionRef} from '#/screens/Profile/Sections/types'

interface ProfilesListProps {
  listUri: string
  headerHeight: number
  scrollElRef: ListRef
}

export const PostsList = React.forwardRef<SectionRef, ProfilesListProps>(
  function PostsListImpl({listUri, headerHeight, scrollElRef}, ref) {
    const feed: FeedDescriptor = `list|${listUri}`
    const {_} = useLingui()

    const onScrollToTop = useCallback(() => {
      scrollElRef.current?.scrollToOffset({
        animated: isNative,
        offset: -headerHeight,
      })
    }, [scrollElRef, headerHeight])

    React.useImperativeHandle(ref, () => ({
      scrollToTop: onScrollToTop,
    }))

    const renderPostsEmpty = useCallback(() => {
      return <EmptyState icon="hashtag" message={_(msg`This feed is empty.`)} />
    }, [_])

    return (
      <View>
        <PostFeed
          feed={feed}
          pollInterval={60e3}
          scrollElRef={scrollElRef}
          renderEmptyState={renderPostsEmpty}
          headerOffset={headerHeight}
        />
      </View>
    )
  },
)
