import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {ActivityIndicator, type ListRenderItemInfo, View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {useOpenComposer} from '#/lib/hooks/useOpenComposer'
import {s} from '#/lib/styles'
import {EditBig_Stroke2_Corner2_Rounded as EditBigIcon} from '#/components/icons/EditBig'
import {
  type CommunityFeedSlice,
  useCommunityFeedSlices,
  useCommunityTimelineQuery,
} from '#/state/queries/community-feed'
import {useSession} from '#/state/session'
import {PostFeedItem} from '#/view/com/posts/PostFeedItem'
import {isThreadChildAt, isThreadParentAt} from '#/view/com/posts/PostFeed'
import {ViewFullThread} from '#/view/com/posts/ViewFullThread'
import {FAB} from '#/view/com/util/fab/FAB'
import {List, type ListMethods} from '#/view/com/util/List'
import {MainScrollProvider} from '#/view/com/util/MainScrollProvider'
import {atoms as a, useTheme} from '#/alf'
import {useHeaderOffset} from '#/components/hooks/useHeaderOffset'
import {Text} from '#/components/Typography'
import {IS_NATIVE} from '#/env'

type CommunityFeedRow =
  | {
      type: 'sliceItem'
      slice: CommunityFeedSlice
      indexInSlice: number
      showReplyTo: boolean
      reactKey: string
    }
  | {
      type: 'viewFullThread'
      uri: string
      reactKey: string
    }

export function CommunityFeedPage({isPageFocused}: {isPageFocused: boolean}) {
  const {_} = useLingui()
  const t = useTheme()
  const {hasSession} = useSession()
  const headerOffset = useHeaderOffset()
  const scrollElRef = useRef<ListMethods>(null)
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

  const slices = useCommunityFeedSlices(feedItems)
  const rows = useMemo(() => {
    const out: CommunityFeedRow[] = []
    slices.forEach(slice => {
      // Deep threads collapse to root + gap + last two, like the Following feed.
      if (slice.isIncompleteThread && slice.items.length >= 3) {
        const beforeLast = slice.items.length - 2
        const last = slice.items.length - 1
        out.push({
          type: 'sliceItem',
          slice,
          indexInSlice: 0,
          showReplyTo: false,
          reactKey: slice.items[0]._reactKey,
        })
        out.push({
          type: 'viewFullThread',
          uri: slice.items[0].uri,
          reactKey: `${slice._reactKey}-viewFullThread`,
        })
        for (const i of [beforeLast, last]) {
          out.push({
            type: 'sliceItem',
            slice,
            indexInSlice: i,
            showReplyTo:
              i === beforeLast &&
              slice.items[i].parentAuthor?.did !==
                slice.items[i].post.author.did,
            reactKey: slice.items[i]._reactKey,
          })
        }
      } else {
        slice.items.forEach((item, i) => {
          out.push({
            type: 'sliceItem',
            slice,
            indexInSlice: i,
            showReplyTo: i === 0,
            reactKey: item._reactKey,
          })
        })
      }
    })
    return out
  }, [slices])

  const [isRefreshing, setIsRefreshing] = useState(false)
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await refetch()
    } finally {
      setIsRefreshing(false)
    }
  }, [refetch])

  useEffect(() => {
    if (isPageFocused) void refetch()
  }, [isPageFocused, refetch])

  useEffect(() => {
    if (!isPageFocused) return
    const id = setInterval(() => void refetch(), 60_000)
    return () => clearInterval(id)
  }, [isPageFocused, refetch])

  const _onScrollToTop = useCallback(() => {
    scrollElRef.current?.scrollToOffset({
      animated: IS_NATIVE,
      offset: -headerOffset,
    })
    void refetch()
  }, [scrollElRef, headerOffset, refetch])

  const renderItem = useCallback(
    ({item, index}: ListRenderItemInfo<CommunityFeedRow>) => {
      if (item.type === 'viewFullThread') {
        return <ViewFullThread uri={item.uri} />
      }
      const {slice, indexInSlice, showReplyTo} = item
      const sliceItem = slice.items[indexInSlice]
      return (
        <PostFeedItem
          post={sliceItem.post}
          record={sliceItem.record}
          reason={undefined}
          feedContext={undefined}
          reqId={undefined}
          moderation={sliceItem.moderation}
          parentAuthor={sliceItem.parentAuthor}
          showReplyTo={showReplyTo}
          isThreadParent={isThreadParentAt(slice.items, indexInSlice)}
          isThreadChild={isThreadChildAt(slice.items, indexInSlice)}
          isThreadLastChild={
            isThreadChildAt(slice.items, indexInSlice) &&
            slice.items.length === indexInSlice + 1
          }
          hideTopBorder={index === 0 && indexInSlice === 0}
          rootPost={slice.items[0].post}
        />
      )
    },
    [],
  )

  const keyExtractor = useCallback(
    (item: {reactKey: string}) => item.reactKey,
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
    if (!hasNextPage && rows.length > 0) {
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
  }, [isFetchingNextPage, hasNextPage, rows.length, t])

  return (
    <View>
      <MainScrollProvider>
        <List
          testID="communityFeedPage"
          ref={scrollElRef}
          data={rows}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.6}
          headerOffset={headerOffset}
          contentContainerStyle={{paddingBottom: 100}}
          refreshing={isRefreshing}
          onRefresh={onRefresh}
        />
      </MainScrollProvider>
      {hasSession && (
        <FAB
          testID="composeFAB"
          onPress={onPressCompose}
          icon={<EditBigIcon size="lg" style={s.white} />}
          accessibilityRole="button"
          accessibilityLabel={_(msg`New post`)}
          accessibilityHint=""
        />
      )}
    </View>
  )
}
