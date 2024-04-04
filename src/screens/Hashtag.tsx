import React from 'react'
import {ListRenderItemInfo, Pressable} from 'react-native'
import {PostView} from '@atproto/api/dist/client/types/app/bsky/feed/defs'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useFocusEffect} from '@react-navigation/native'
import {NativeStackScreenProps} from '@react-navigation/native-stack'

import {HITSLOP_10} from 'lib/constants'
import {useInitialNumToRender} from 'lib/hooks/useInitialNumToRender'
import {CommonNavigatorParams} from 'lib/routes/types'
import {shareUrl} from 'lib/sharing'
import {cleanError} from 'lib/strings/errors'
import {sanitizeHandle} from 'lib/strings/handles'
import {enforceLen} from 'lib/strings/helpers'
import {isNative} from 'platform/detection'
import {useSearchPostsQuery} from 'state/queries/search-posts'
import {useSetMinimalShellMode} from 'state/shell'
import {Post} from 'view/com/post/Post'
import {List} from 'view/com/util/List'
import {ViewHeader} from 'view/com/util/ViewHeader'
import {ArrowOutOfBox_Stroke2_Corner0_Rounded} from '#/components/icons/ArrowOutOfBox'
import {
  ListFooter,
  ListHeaderDesktop,
  ListMaybePlaceholder,
} from '#/components/Lists'

const renderItem = ({item}: ListRenderItemInfo<PostView>) => {
  return <Post post={item} />
}

const keyExtractor = (item: PostView, index: number) => {
  return `${item.uri}-${index}`
}

export default function HashtagScreen({
  route,
}: NativeStackScreenProps<CommonNavigatorParams, 'Hashtag'>) {
  const {tag, author} = route.params
  const setMinimalShellMode = useSetMinimalShellMode()
  const {_} = useLingui()
  const initialNumToRender = useInitialNumToRender()
  const [isPTR, setIsPTR] = React.useState(false)

  const fullTag = React.useMemo(() => {
    return `#${decodeURIComponent(tag)}`
  }, [tag])

  const queryParam = React.useMemo(() => {
    if (!author) return fullTag
    return `${fullTag} from:${sanitizeHandle(author)}`
  }, [fullTag, author])

  const headerTitle = React.useMemo(() => {
    return enforceLen(fullTag.toLowerCase(), 24, true, 'middle')
  }, [fullTag])

  const sanitizedAuthor = React.useMemo(() => {
    if (!author) return
    return sanitizeHandle(author)
  }, [author])

  const {
    data,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
  } = useSearchPostsQuery({query: queryParam})

  const posts = React.useMemo(() => {
    return data?.pages.flatMap(page => page.posts) || []
  }, [data])

  useFocusEffect(
    React.useCallback(() => {
      setMinimalShellMode(false)
    }, [setMinimalShellMode]),
  )

  const onShare = React.useCallback(() => {
    const url = new URL('https://bsky.app')
    url.pathname = `/hashtag/${decodeURIComponent(tag)}`
    if (author) {
      url.searchParams.set('author', author)
    }
    shareUrl(url.toString())
  }, [tag, author])

  const onRefresh = React.useCallback(async () => {
    setIsPTR(true)
    await refetch()
    setIsPTR(false)
  }, [refetch])

  const onEndReached = React.useCallback(() => {
    if (isFetchingNextPage || !hasNextPage || error) return
    fetchNextPage()
  }, [isFetchingNextPage, hasNextPage, error, fetchNextPage])

  return (
    <>
      <ViewHeader
        title={headerTitle}
        subtitle={author ? _(msg`From @${sanitizedAuthor}`) : undefined}
        canGoBack
        renderButton={
          isNative
            ? () => (
                <Pressable
                  accessibilityRole="button"
                  onPress={onShare}
                  hitSlop={HITSLOP_10}>
                  <ArrowOutOfBox_Stroke2_Corner0_Rounded
                    size="lg"
                    onPress={onShare}
                  />
                </Pressable>
              )
            : undefined
        }
      />
      {posts.length < 1 ? (
        <ListMaybePlaceholder
          isLoading={isLoading}
          isError={isError}
          onRetry={refetch}
          emptyType="results"
          emptyMessage={_(msg`We couldn't find any results for that hashtag.`)}
        />
      ) : (
        <List
          data={posts}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          refreshing={isPTR}
          onRefresh={onRefresh}
          onEndReached={onEndReached}
          onEndReachedThreshold={4}
          // @ts-ignore web only -prf
          desktopFixedHeight
          ListHeaderComponent={
            <ListHeaderDesktop
              title={headerTitle}
              subtitle={author ? _(msg`From @${sanitizedAuthor}`) : undefined}
            />
          }
          ListFooterComponent={
            <ListFooter
              isFetchingNextPage={isFetchingNextPage}
              error={cleanError(error)}
              onRetry={fetchNextPage}
            />
          }
          initialNumToRender={initialNumToRender}
          windowSize={11}
        />
      )}
    </>
  )
}
