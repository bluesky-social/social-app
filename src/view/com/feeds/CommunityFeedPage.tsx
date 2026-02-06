import {useCallback, useMemo, useRef} from 'react'
import {ActivityIndicator, type ListRenderItemInfo, View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useOpenComposer} from '#/lib/hooks/useOpenComposer'
import {ComposeIcon2} from '#/lib/icons'
import {s} from '#/lib/styles'
import {
  type HydratedCommunityPost,
  useCommunityFeedHydrated,
  useCommunityTimelineQuery,
} from '#/state/queries/community-feed'
import {useSession} from '#/state/session'
import {PostFeedItem} from '#/view/com/posts/PostFeedItem'
import {FAB} from '#/view/com/util/fab/FAB'
import {List} from '#/view/com/util/List'
import {MainScrollProvider} from '#/view/com/util/MainScrollProvider'
import {atoms as a, useTheme} from '#/alf'
import {useHeaderOffset} from '#/components/hooks/useHeaderOffset'
import {Text} from '#/components/Typography'
import {IS_NATIVE} from '#/env'

export function CommunityFeedPage({isPageFocused}: {isPageFocused: boolean}) {
  const {_} = useLingui()
  const t = useTheme()
  const {hasSession} = useSession()
  const headerOffset = useHeaderOffset()
  const scrollElRef = useRef<any>(null)
  const {openComposer} = useOpenComposer()

  const onPressCompose = useCallback(() => {
    openComposer({logContext: 'Fab'})
  }, [openComposer])

  const {
    data,
    isLoading,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
  } = useCommunityTimelineQuery(isPageFocused)

  const feedItems = useMemo(
    () => data?.pages.flatMap(page => page.feed ?? []) ?? [],
    [data],
  )

  const hydratedPosts = useCommunityFeedHydrated(feedItems)

  const _onScrollToTop = useCallback(() => {
    scrollElRef.current?.scrollToOffset({
      animated: IS_NATIVE,
      offset: -headerOffset,
    })
    refetch()
  }, [scrollElRef, headerOffset, refetch])

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
      <View style={[a.py_xl, a.align_center]}>
        <Text style={[t.atoms.text_contrast_medium]}>
          <Trans>No community posts yet</Trans>
        </Text>
      </View>
    )
  }, [isLoading, isError, t])

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
      <MainScrollProvider>
        <List
          testID="communityFeedPage"
          ref={scrollElRef}
          data={hydratedPosts}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.6}
          headerOffset={headerOffset}
          contentContainerStyle={{paddingBottom: 100}}
        />
      </MainScrollProvider>
      {hasSession && (
        <FAB
          testID="composeFAB"
          onPress={onPressCompose}
          icon={<ComposeIcon2 strokeWidth={1.5} size={29} style={s.white} />}
          accessibilityRole="button"
          accessibilityLabel={_(msg`New post`)}
          accessibilityHint=""
        />
      )}
    </View>
  )
}
