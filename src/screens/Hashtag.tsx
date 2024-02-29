import React from 'react'
import {ListRenderItemInfo, View} from 'react-native'
import {atoms as a} from '#/alf'
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
  ListMaybeLoading,
} from '#/components/Lists'
import {List} from 'view/com/util/List'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

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
  const [isPTR, setIsPTR] = React.useState(false)

  const query = React.useMemo(() => {
    const queryTag = !tag.startsWith('#') ? `#${tag}` : tag

    if (!author) return queryTag
    return `${queryTag} from:${author}`
  }, [tag, author])

  const headerTitle = React.useMemo(() => {
    return `#${enforceLen(tag.toLowerCase(), 24)}`
  }, [tag])

  const {
    data,
    isFetching,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
  } = useSearchPostsQuery({query})

  const posts = React.useMemo(() => {
    return data?.pages.flatMap(page => page.posts) || []
  }, [data])

  useFocusEffect(
    React.useCallback(() => {
      setMinimalShellMode(false)
    }, [setMinimalShellMode]),
  )

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
    <View style={a.flex_1}>
      <ViewHeader
        title={headerTitle}
        subtitle={author ? `${_(msg`By`)} ${author}` : undefined}
        canGoBack={true}
      />
      <ListMaybeLoading isLoading={isLoading} />
      {!isLoading && (
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
              subtitle={author ? `${_(msg`By`)} ${author}` : undefined}
            />
          }
          ListFooterComponent={
            <ListFooter
              isFetching={isFetching}
              isError={isError}
              error={error?.name}
              onRetry={hasNextPage ? fetchNextPage : refetch}
            />
          }
        />
      )}
    </View>
  )
}
