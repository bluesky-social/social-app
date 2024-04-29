import React from 'react'
import {ListRenderItemInfo, Pressable, StyleSheet, View} from 'react-native'
import {PostView} from '@atproto/api/dist/client/types/app/bsky/feed/defs'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useFocusEffect} from '@react-navigation/native'
import {NativeStackScreenProps} from '@react-navigation/native-stack'

import {usePalette} from '#/lib/hooks/usePalette'
import {HITSLOP_10} from 'lib/constants'
import {useInitialNumToRender} from 'lib/hooks/useInitialNumToRender'
import {CommonNavigatorParams} from 'lib/routes/types'
import {shareUrl} from 'lib/sharing'
import {cleanError} from 'lib/strings/errors'
import {sanitizeHandle} from 'lib/strings/handles'
import {enforceLen} from 'lib/strings/helpers'
import {isNative, isWeb} from 'platform/detection'
import {useSearchPostsQuery} from 'state/queries/search-posts'
import {useSetDrawerSwipeDisabled, useSetMinimalShellMode} from 'state/shell'
import {Pager} from '#/view/com/pager/Pager'
import {TabBar} from '#/view/com/pager/TabBar'
import {CenteredView} from '#/view/com/util/Views'
import {Post} from 'view/com/post/Post'
import {List} from 'view/com/util/List'
import {ViewHeader} from 'view/com/util/ViewHeader'
import {ArrowOutOfBox_Stroke2_Corner0_Rounded} from '#/components/icons/ArrowOutOfBox'
import {ListFooter, ListMaybePlaceholder} from '#/components/Lists'

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
  const {_} = useLingui()
  const pal = usePalette('default')

  const fullTag = React.useMemo(() => {
    return `#${decodeURIComponent(tag)}`
  }, [tag])

  const headerTitle = React.useMemo(() => {
    return enforceLen(fullTag.toLowerCase(), 24, true, 'middle')
  }, [fullTag])

  const sanitizedAuthor = React.useMemo(() => {
    if (!author) return
    return sanitizeHandle(author)
  }, [author])

  const onShare = React.useCallback(() => {
    const url = new URL('https://bsky.app')
    url.pathname = `/hashtag/${decodeURIComponent(tag)}`
    if (author) {
      url.searchParams.set('author', author)
    }
    shareUrl(url.toString())
  }, [tag, author])

  const [activeTab, setActiveTab] = React.useState(0)
  const setMinimalShellMode = useSetMinimalShellMode()
  const setDrawerSwipeDisabled = useSetDrawerSwipeDisabled()

  useFocusEffect(
    React.useCallback(() => {
      setMinimalShellMode(false)
    }, [setMinimalShellMode]),
  )

  const onPageSelected = React.useCallback(
    (index: number) => {
      setMinimalShellMode(false)
      setDrawerSwipeDisabled(index > 0)
      setActiveTab(index)
    },
    [setDrawerSwipeDisabled, setMinimalShellMode],
  )

  const sections = React.useMemo(() => {
    return [
      {
        title: _(msg`Top`),
        component: (
          <HashtagScreenTab
            fullTag={fullTag}
            author={author}
            sort="top"
            active={activeTab === 0}
          />
        ),
      },
      {
        title: _(msg`Latest`),
        component: (
          <HashtagScreenTab
            fullTag={fullTag}
            author={author}
            sort="latest"
            active={activeTab === 1}
          />
        ),
      },
    ]
  }, [_, fullTag, author, activeTab])

  return (
    <>
      <CenteredView sideBorders style={[pal.border, pal.view]}>
        <ViewHeader
          showOnDesktop
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
      </CenteredView>
      <Pager
        onPageSelected={onPageSelected}
        renderTabBar={props => (
          <CenteredView
            sideBorders
            style={[pal.border, pal.view, styles.tabBarContainer]}>
            <TabBar items={sections.map(section => section.title)} {...props} />
          </CenteredView>
        )}
        initialPage={0}>
        {sections.map((section, i) => (
          <View key={i}>{section.component}</View>
        ))}
      </Pager>
    </>
  )
}

function HashtagScreenTab({
  fullTag,
  author,
  sort,
  active,
}: {
  fullTag: string
  author: string | undefined
  sort: 'top' | 'latest'
  active: boolean
}) {
  const {_} = useLingui()
  const initialNumToRender = useInitialNumToRender()
  const [isPTR, setIsPTR] = React.useState(false)

  const queryParam = React.useMemo(() => {
    if (!author) return fullTag
    return `${fullTag} from:${sanitizeHandle(author)}`
  }, [fullTag, author])

  const {
    data,
    isFetched,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
  } = useSearchPostsQuery({query: queryParam, sort, enabled: active})

  const posts = React.useMemo(() => {
    return data?.pages.flatMap(page => page.posts) || []
  }, [data])

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
      {posts.length < 1 ? (
        <ListMaybePlaceholder
          isLoading={isLoading || !isFetched}
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

const styles = StyleSheet.create({
  tabBarContainer: {
    // @ts-ignore web only
    position: isWeb ? 'sticky' : '',
    top: 0,
    zIndex: 1,
  },
})
