import React from 'react'
import {type ListRenderItemInfo, View} from 'react-native'
import {type AppBskyFeedDefs} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useFocusEffect} from '@react-navigation/native'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'

import {HITSLOP_10} from '#/lib/constants'
import {useInitialNumToRender} from '#/lib/hooks/useInitialNumToRender'
import {type CommonNavigatorParams} from '#/lib/routes/types'
import {shareUrl} from '#/lib/sharing'
import {cleanError} from '#/lib/strings/errors'
import {sanitizeHandle} from '#/lib/strings/handles'
import {enforceLen} from '#/lib/strings/helpers'
import {useSearchPostsQuery} from '#/state/queries/search-posts'
import {useSetMinimalShellMode} from '#/state/shell'
import {Pager} from '#/view/com/pager/Pager'
import {TabBar} from '#/view/com/pager/TabBar'
import {Post} from '#/view/com/post/Post'
import {List} from '#/view/com/util/List'
import {atoms as a, web} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {ArrowOutOfBoxModified_Stroke2_Corner2_Rounded as Share} from '#/components/icons/ArrowOutOfBox'
import * as Layout from '#/components/Layout'
import {ListFooter, ListMaybePlaceholder} from '#/components/Lists'

const renderItem = ({item}: ListRenderItemInfo<AppBskyFeedDefs.PostView>) => {
  return <Post post={item} />
}

const keyExtractor = (item: AppBskyFeedDefs.PostView, index: number) => {
  return `${item.uri}-${index}`
}

export default function HashtagScreen({
  route,
}: NativeStackScreenProps<CommonNavigatorParams, 'Hashtag'>) {
  const {tag, author} = route.params
  const {_} = useLingui()

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

  useFocusEffect(
    React.useCallback(() => {
      setMinimalShellMode(false)
    }, [setMinimalShellMode]),
  )

  const onPageSelected = React.useCallback(
    (index: number) => {
      setMinimalShellMode(false)
      setActiveTab(index)
    },
    [setMinimalShellMode],
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
    <Layout.Screen>
      <Pager
        onPageSelected={onPageSelected}
        renderTabBar={props => (
          <Layout.Center style={[a.z_10, web([a.sticky, {top: 0}])]}>
            <Layout.Header.Outer noBottomBorder>
              <Layout.Header.BackButton />
              <Layout.Header.Content>
                <Layout.Header.TitleText>{headerTitle}</Layout.Header.TitleText>
                {author && (
                  <Layout.Header.SubtitleText>
                    {_(msg`From @${sanitizedAuthor}`)}
                  </Layout.Header.SubtitleText>
                )}
              </Layout.Header.Content>
              <Layout.Header.Slot>
                <Button
                  label={_(msg`Share`)}
                  size="small"
                  variant="ghost"
                  color="primary"
                  shape="round"
                  onPress={onShare}
                  hitSlop={HITSLOP_10}
                  style={[{right: -3}]}>
                  <ButtonIcon icon={Share} size="md" />
                </Button>
              </Layout.Header.Slot>
            </Layout.Header.Outer>
            <TabBar items={sections.map(section => section.title)} {...props} />
          </Layout.Center>
        )}
        initialPage={0}>
        {sections.map((section, i) => (
          <View key={i}>{section.component}</View>
        ))}
      </Pager>
    </Layout.Screen>
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
    return `${fullTag} from:${author}`
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
