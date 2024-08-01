import React, {useCallback, useMemo, useState} from 'react'
import {ActivityIndicator, StyleSheet, View} from 'react-native'
import {
  AppBskyFeedDefs,
  AppBskyFeedPost,
  ModerationDecision,
} from '@atproto/api'

import {moderatePost_wrapped as moderatePost} from '#/lib/moderatePost_wrapped'
import {cleanError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {usePostQuotesQuery} from '#/state/queries/post-quotes'
import {useResolveUriQuery} from '#/state/queries/resolve-uri'
import {FeedItem} from '../posts/FeedItem'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {List} from '../util/List'
import {LoadingScreen} from '../util/LoadingScreen'
import {CenteredView} from '../util/Views'

export function PostQuotes({uri}: {uri: string}) {
  const [isPTRing, setIsPTRing] = useState(false)
  const {
    data: resolvedUri,
    error: resolveError,
    isFetching: isFetchingResolvedUri,
  } = useResolveUriQuery(uri)
  const {
    data,
    isFetching,
    isFetched,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
    error,
    refetch,
  } = usePostQuotesQuery(resolvedUri?.uri)
  const moderationOpts = useModerationOpts()

  const quotes = useMemo(() => {
    if (data?.pages) {
      return data.pages
        .flatMap(page => page.posts)
        .map(post => {
          if (!AppBskyFeedPost.isRecord(post.record) || !moderationOpts) {
            return null
          }
          const moderation = moderatePost(post, moderationOpts)
          return {post, record: post.record, moderation}
        })
        .filter(item => item !== null)
    }
  }, [data, moderationOpts])

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
    if (isFetching || !hasNextPage || isError) return
    try {
      await fetchNextPage()
    } catch (err) {
      logger.error('Failed to load more quotes', {message: err})
    }
  }, [isFetching, hasNextPage, isError, fetchNextPage])

  const renderItem = useCallback(
    ({
      item,
      index,
    }: {
      item: {
        post: AppBskyFeedDefs.PostView
        moderation: ModerationDecision
        record: AppBskyFeedPost.Record
      }
      index: number
    }) => {
      return (
        <FeedItem
          key={item.post.uri}
          post={item.post}
          record={item.record}
          moderation={item.moderation}
          hideTopBorder={index === 0}
          reason={undefined}
          parentAuthor={undefined}
          feedContext={undefined}
          showReplyTo={false}
        />
      )
    },
    [],
  )

  if (isFetchingResolvedUri || !isFetched) {
    return <LoadingScreen />
  }

  // error
  // =
  if (resolveError || isError) {
    return (
      <CenteredView>
        <ErrorMessage
          message={cleanError(resolveError || error)}
          onPressTryAgain={onRefresh}
        />
      </CenteredView>
    )
  }

  // loaded
  // =
  return (
    <List
      data={quotes}
      keyExtractor={item => item.did}
      refreshing={isPTRing}
      onRefresh={onRefresh}
      onEndReached={onEndReached}
      renderItem={renderItem}
      initialNumToRender={15}
      // FIXME(dan)
      // eslint-disable-next-line react/no-unstable-nested-components
      ListFooterComponent={() => (
        <View style={styles.footer}>
          {(isFetching || isFetchingNextPage) && <ActivityIndicator />}
        </View>
      )}
      // @ts-ignore our .web version only -prf
      desktopFixedHeight
    />
  )
}

const styles = StyleSheet.create({
  footer: {
    height: 200,
    paddingTop: 20,
  },
})
