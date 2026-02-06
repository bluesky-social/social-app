import {useCallback, useEffect, useImperativeHandle, useMemo} from 'react'
import {
  ActivityIndicator,
  findNodeHandle,
  type ListRenderItemInfo,
  View,
} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {
  type HydratedCommunityPost,
  useCommunityFeedHydrated,
  useCommunityFeedQuery,
} from '#/state/queries/community-feed'
import {PostFeedItem} from '#/view/com/posts/PostFeedItem'
import {EmptyState} from '#/view/com/util/EmptyState'
import {List, type ListRef} from '#/view/com/util/List'
import {atoms as a, ios, useTheme} from '#/alf'
import {Text} from '#/components/Typography'
import {IS_IOS, IS_NATIVE} from '#/env'
import {type SectionRef} from './types'

interface CommunityFeedSectionProps {
  ref?: React.Ref<SectionRef>
  actor: string
  headerHeight: number
  isFocused: boolean
  scrollElRef: ListRef
  setScrollViewTag: (tag: number | null) => void
}

export function CommunityFeedSection({
  ref,
  actor,
  headerHeight,
  isFocused,
  scrollElRef,
  setScrollViewTag,
}: CommunityFeedSectionProps) {
  const {_} = useLingui()
  const t = useTheme()
  const {
    data,
    isLoading,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
  } = useCommunityFeedQuery(isFocused ? actor : undefined)

  const feedItems = useMemo(
    () => data?.pages.flatMap(page => page.feed ?? []) ?? [],
    [data],
  )

  const hydratedPosts = useCommunityFeedHydrated(feedItems)

  const onScrollToTop = useCallback(() => {
    scrollElRef.current?.scrollToOffset({
      animated: IS_NATIVE,
      offset: -headerHeight,
    })
    refetch()
  }, [scrollElRef, headerHeight, refetch])

  useImperativeHandle(ref, () => ({
    scrollToTop: onScrollToTop,
  }))

  useEffect(() => {
    if (IS_IOS && isFocused && scrollElRef.current) {
      const nativeTag = findNodeHandle(scrollElRef.current)
      setScrollViewTag(nativeTag)
    }
  }, [isFocused, scrollElRef, setScrollViewTag])

  const renderItem = useCallback(
    ({item, index}: ListRenderItemInfo<HydratedCommunityPost>) => {
      return (
        <PostFeedItem
          post={item.post}
          record={item.record}
          reason={undefined}
          feedContext={undefined}
          reqId={undefined}
          moderation={item.moderation}
          parentAuthor={undefined}
          showReplyTo={false}
          hideTopBorder={index === 0}
          rootPost={item.post}
        />
      )
    },
    [],
  )

  const keyExtractor = useCallback(
    (item: HydratedCommunityPost) => item.post.uri,
    [],
  )

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const renderEmpty = useCallback(() => {
    if (isLoading) {
      return (
        <View style={[a.py_xl, a.align_center]}>
          <ActivityIndicator />
        </View>
      )
    }
    if (isError) {
      return (
        <View style={[a.py_xl, a.align_center]}>
          <Text style={[t.atoms.text_contrast_medium]}>
            <Trans>Failed to load community posts</Trans>
          </Text>
        </View>
      )
    }
    return (
      <EmptyState
        style={{width: '100%'}}
        icon={undefined}
        iconSize="3xl"
        message={_(msg`No community posts yet`)}
      />
    )
  }, [_, isLoading, isError, t])

  const renderFooter = useCallback(() => {
    if (isFetchingNextPage) {
      return (
        <View style={[a.py_md, a.align_center]}>
          <ActivityIndicator />
        </View>
      )
    }
    if (!hasNextPage && hydratedPosts.length > 0) {
      return (
        <View
          style={[
            a.w_full,
            a.py_5xl,
            a.border_t,
            t.atoms.border_contrast_medium,
          ]}>
          <Text style={[t.atoms.text_contrast_medium, a.text_center]}>
            <Trans>End of feed</Trans>
          </Text>
        </View>
      )
    }
    return null
  }, [isFetchingNextPage, hasNextPage, hydratedPosts.length, t])

  return (
    <View>
      <List
        testID="communityFeed"
        ref={scrollElRef}
        data={hydratedPosts}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.6}
        headerOffset={headerHeight}
        progressViewOffset={ios(0)}
        contentContainerStyle={{paddingBottom: 100}}
      />
    </View>
  )
}
