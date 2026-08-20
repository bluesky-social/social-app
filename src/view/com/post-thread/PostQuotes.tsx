import {useCallback, useState} from 'react'
import {moderatePost, type ModerationDecision} from '@bsky/sdk/moderation'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'

import {useInitialNumToRender} from '#/lib/hooks/useInitialNumToRender'
import {usePostViewTracking} from '#/lib/hooks/usePostViewTracking'
import {cleanError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {usePostQuotesQuery} from '#/state/queries/post-quotes'
import {useResolveUriQuery} from '#/state/queries/resolve-uri'
import {Post} from '#/view/com/post/Post'
import {ListFooter, ListMaybePlaceholder} from '#/components/Lists'
import type * as AppBskyFeedDefs from '#/lexicons/app/bsky/feed/defs'
import * as AppBskyFeedPost from '#/lexicons/app/bsky/feed/post'
import * as bsky from '#/types/bsky'
import {List} from '../util/List'

function renderItem({
  item,
  index,
}: {
  item: {
    post: AppBskyFeedDefs.PostView
    moderation: ModerationDecision
    record: AppBskyFeedPost.Main
  }
  index: number
}) {
  return <Post post={item.post} hideTopBorder={index === 0} />
}

function keyExtractor(item: {
  post: AppBskyFeedDefs.PostView
  moderation: ModerationDecision
  record: AppBskyFeedPost.Main
}) {
  return item.post.uri
}

export function PostQuotes({uri}: {uri: string}) {
  const {_} = useLingui()
  const initialNumToRender = useInitialNumToRender()
  const [isPTRing, setIsPTRing] = useState(false)
  const trackPostView = usePostViewTracking('PostQuotes')

  const {
    data: resolvedUri,
    error: resolveError,
    isLoading: isLoadingUri,
  } = useResolveUriQuery(uri)
  const {
    data,
    isLoading: isLoadingQuotes,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
    refetch,
  } = usePostQuotesQuery(resolvedUri?.uri)

  const moderationOpts = useModerationOpts()

  const isError = Boolean(resolveError || error)

  const quotes =
    data?.pages
      .flatMap(page =>
        page.posts.map(post => {
          if (!bsky.isType(AppBskyFeedPost, post.record) || !moderationOpts) {
            return null
          }
          const moderation = moderatePost(post, moderationOpts)
          return {post, record: post.record, moderation}
        }),
      )
      .filter(item => item !== null) ?? []

  const onRefresh = useCallback(async () => {
    setIsPTRing(true)
    try {
      await refetch()
    } catch (err) {
      logger.error('Failed to refresh quotes', {message: err})
    }
    setIsPTRing(false)
  }, [refetch, setIsPTRing])

  const onEndReached = useCallback(async () => {
    if (isFetchingNextPage || !hasNextPage || isError) return
    try {
      await fetchNextPage()
    } catch (err) {
      logger.error('Failed to load more quotes', {message: err})
    }
  }, [isFetchingNextPage, hasNextPage, isError, fetchNextPage])

  if (quotes.length < 1) {
    return (
      <ListMaybePlaceholder
        isLoading={isLoadingUri || isLoadingQuotes}
        isError={isError}
        emptyType="results"
        emptyTitle={_(msg`No quotes yet`)}
        emptyMessage={_(
          msg`Nobody has quoted this yet. Maybe you should be the first!`,
        )}
        errorMessage={cleanError(resolveError || error)}
        sideBorders={false}
      />
    )
  }

  // loaded
  // =
  return (
    <List
      data={quotes}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      refreshing={isPTRing}
      onRefresh={onRefresh}
      onEndReached={onEndReached}
      onEndReachedThreshold={4}
      onItemSeen={item => trackPostView(item.post)}
      ListFooterComponent={
        <ListFooter
          isFetchingNextPage={isFetchingNextPage}
          error={cleanError(error)}
          onRetry={fetchNextPage}
          showEndMessage
          endMessageText={_(msg`That's all, folks!`)}
        />
      }
      // @ts-ignore our .web version only -prf
      desktopFixedHeight
      initialNumToRender={initialNumToRender}
      windowSize={11}
      sideBorders={false}
    />
  )
}
