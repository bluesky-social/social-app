import React, {useCallback, useState} from 'react'
import {
  AppBskyFeedDefs,
  AppBskyFeedPost,
  ModerationDecision,
} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {moderatePost_wrapped as moderatePost} from '#/lib/moderatePost_wrapped'
import {cleanError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {usePostQuotesQuery} from '#/state/queries/post-quotes'
import {useResolveUriQuery} from '#/state/queries/resolve-uri'
import {useInitialNumToRender} from 'lib/hooks/useInitialNumToRender'
import {Post} from 'view/com/post/Post'
import {
  ListFooter,
  ListHeaderDesktop,
  ListMaybePlaceholder,
} from '#/components/Lists'
import {List} from '../util/List'

function renderItem({
  item,
}: {
  item: {
    post: AppBskyFeedDefs.PostView
    moderation: ModerationDecision
    record: AppBskyFeedPost.Record
  }
}) {
  return <Post post={item.post} />
}

function keyExtractor(item: {
  post: AppBskyFeedDefs.PostView
  moderation: ModerationDecision
  record: AppBskyFeedPost.Record
}) {
  return item.post.uri
}

export function PostQuotes({uri}: {uri: string}) {
  const {_} = useLingui()
  const initialNumToRender = useInitialNumToRender()

  const [isPTRing, setIsPTRing] = useState(false)

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
          if (!AppBskyFeedPost.isRecord(post.record) || !moderationOpts) {
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

  if (isLoadingUri || isLoadingQuotes || isError) {
    return (
      <ListMaybePlaceholder
        isLoading={isLoadingUri || isLoadingQuotes}
        isError={isError}
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
      ListHeaderComponent={<ListHeaderDesktop title={_(msg`Quotes`)} />}
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
    />
  )
}
