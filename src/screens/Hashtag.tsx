import React from 'react'
import {ListRenderItemInfo, Pressable} from 'react-native'
import {atoms as a, useBreakpoints} from '#/alf'
import {useFocusEffect} from '@react-navigation/native'
import {useSetMinimalShellMode} from 'state/shell'
import {ViewHeader} from 'view/com/util/ViewHeader'
import {NativeStackScreenProps} from '@react-navigation/native-stack'
import {CommonNavigatorParams} from 'lib/routes/types'
import {useSearchPostsQuery} from 'state/queries/search-posts'
import {Post} from 'view/com/post/Post'
import {PostView} from '@atproto/api/dist/client/types/app/bsky/feed/defs'
import {enforceLen} from 'lib/strings/helpers'
import {
  ListFooter,
  ListHeaderDesktop,
  ListMaybePlaceholder,
} from '#/components/Lists'
import {List} from 'view/com/util/List'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {sanitizeHandle} from 'lib/strings/handles'
import {CenteredView} from 'view/com/util/Views'
import {ArrowOutOfBox_Stroke2_Corner0_Rounded} from '#/components/icons/ArrowOutOfBox'
import {shareUrl} from 'lib/sharing'
import {HITSLOP_10} from 'lib/constants'
import {isNative} from 'platform/detection'

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
  const {gtMobile} = useBreakpoints()
  const {_} = useLingui()
  const [isPTR, setIsPTR] = React.useState(false)

  const fullTag = React.useMemo(() => {
    return `#${tag.replaceAll('%23', '#')}`
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
    isFetching,
    isLoading,
    isRefetching,
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
    url.pathname = `/hashtag/${tag}`
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
    if (isFetching || !hasNextPage || error) return
    fetchNextPage()
  }, [isFetching, hasNextPage, error, fetchNextPage])

  return (
    <CenteredView style={a.flex_1} sideBorders={gtMobile}>
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
      <ListMaybePlaceholder
        isLoading={isLoading || isRefetching}
        isError={isError}
        isEmpty={posts.length < 1}
        onRetry={refetch}
        notFoundType="results"
        empty={_(msg`We couldn't find any results for that hashtag.`)}
      />
      {!isLoading && posts.length > 0 && (
        <List<PostView>
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
              isFetching={isFetching && !isRefetching}
              isError={isError}
              error={error?.name}
              onRetry={fetchNextPage}
            />
          }
        />
      )}
    </CenteredView>
  )
}
