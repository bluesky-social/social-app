import {useCallback, useMemo, useState} from 'react'
import {View} from 'react-native'
import {
  type $Typed,
  type AppBskyBookmarkDefs,
  AppBskyFeedDefs,
} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {
  type NavigationProp,
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native'

import {useCleanError} from '#/lib/hooks/useCleanError'
import {useInitialNumToRender} from '#/lib/hooks/useInitialNumToRender'
import {usePostViewTracking} from '#/lib/hooks/usePostViewTracking'
import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {logger} from '#/logger'
import {useBookmarkMutation} from '#/state/queries/bookmarks/useBookmarkMutation'
import {useBookmarksQuery} from '#/state/queries/bookmarks/useBookmarksQuery'
import {useSetMinimalShellMode} from '#/state/shell'
import {Post} from '#/view/com/post/Post'
import {EmptyState} from '#/view/com/util/EmptyState'
import {List} from '#/view/com/util/List'
import {PostFeedLoadingPlaceholder} from '#/view/com/util/LoadingPlaceholder'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {BookmarkDeleteLarge, BookmarkFilled} from '#/components/icons/Bookmark'
import {CircleQuestion_Stroke2_Corner2_Rounded as QuestionIcon} from '#/components/icons/CircleQuestion'
import * as Layout from '#/components/Layout'
import {ListFooter} from '#/components/Lists'
import * as Skele from '#/components/Skeleton'
import * as toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {IS_IOS} from '#/env'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'Bookmarks'>

export function BookmarksScreen({}: Props) {
  const setMinimalShellMode = useSetMinimalShellMode()

  useFocusEffect(
    useCallback(() => {
      setMinimalShellMode(false)
      logger.metric('bookmarks:view', {})
    }, [setMinimalShellMode]),
  )

  return (
    <Layout.Screen testID="bookmarksScreen">
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Saved Posts</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <BookmarksInner />
    </Layout.Screen>
  )
}

type ListItem =
  | {
      type: 'loading'
      key: 'loading'
    }
  | {
      type: 'empty'
      key: 'empty'
    }
  | {
      type: 'bookmark'
      key: string
      bookmark: Omit<AppBskyBookmarkDefs.BookmarkView, 'item'> & {
        item: $Typed<AppBskyFeedDefs.PostView>
      }
    }
  | {
      type: 'bookmarkNotFound'
      key: string
      bookmark: Omit<AppBskyBookmarkDefs.BookmarkView, 'item'> & {
        item: $Typed<AppBskyFeedDefs.NotFoundPost>
      }
    }

function BookmarksInner() {
  const initialNumToRender = useInitialNumToRender()
  const cleanError = useCleanError()
  const [isPTRing, setIsPTRing] = useState(false)
  const trackPostView = usePostViewTracking('Bookmarks')
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
    refetch,
  } = useBookmarksQuery()
  const cleanedError = useMemo(() => {
    const {raw, clean} = cleanError(error)
    return clean || raw
  }, [error, cleanError])

  const onRefresh = useCallback(async () => {
    setIsPTRing(true)
    try {
      await refetch()
    } finally {
      setIsPTRing(false)
    }
  }, [refetch, setIsPTRing])

  const onEndReached = useCallback(async () => {
    if (isFetchingNextPage || !hasNextPage || error) return
    try {
      await fetchNextPage()
    } catch {}
  }, [isFetchingNextPage, hasNextPage, error, fetchNextPage])

  const items = useMemo(() => {
    const i: ListItem[] = []

    if (isLoading) {
      i.push({type: 'loading', key: 'loading'})
    } else if (error || !data) {
      // handled in Footer
    } else {
      const bookmarks = data.pages.flatMap(p => p.bookmarks)

      if (bookmarks.length > 0) {
        for (const bookmark of bookmarks) {
          if (AppBskyFeedDefs.isNotFoundPost(bookmark.item)) {
            i.push({
              type: 'bookmarkNotFound',
              key: bookmark.item.uri,
              bookmark: {
                ...bookmark,
                item: bookmark.item as $Typed<AppBskyFeedDefs.NotFoundPost>,
              },
            })
          }
          if (AppBskyFeedDefs.isPostView(bookmark.item)) {
            i.push({
              type: 'bookmark',
              key: bookmark.item.uri,
              bookmark: {
                ...bookmark,
                item: bookmark.item as $Typed<AppBskyFeedDefs.PostView>,
              },
            })
          }
        }
      } else {
        i.push({type: 'empty', key: 'empty'})
      }
    }

    return i
  }, [isLoading, error, data])

  const isEmpty = items.length === 1 && items[0]?.type === 'empty'

  return (
    <List
      data={items}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      refreshing={isPTRing}
      onRefresh={onRefresh}
      onEndReached={onEndReached}
      onEndReachedThreshold={4}
      onItemSeen={item => {
        if (item.type === 'bookmark') {
          trackPostView(item.bookmark.item)
        }
      }}
      ListFooterComponent={
        <ListFooter
          isFetchingNextPage={isFetchingNextPage}
          error={cleanedError}
          onRetry={fetchNextPage}
          style={[isEmpty && a.border_t_0]}
        />
      }
      initialNumToRender={initialNumToRender}
      windowSize={9}
      maxToRenderPerBatch={IS_IOS ? 5 : 1}
      updateCellsBatchingPeriod={40}
      sideBorders={false}
    />
  )
}

function BookmarkNotFound({
  hideTopBorder,
  post,
}: {
  hideTopBorder: boolean
  post: $Typed<AppBskyFeedDefs.NotFoundPost>
}) {
  const t = useTheme()
  const {_} = useLingui()
  const {mutateAsync: bookmark} = useBookmarkMutation()
  const cleanError = useCleanError()

  const remove = async () => {
    try {
      await bookmark({action: 'delete', uri: post.uri})
      toast.show(_(msg`Removed from saved posts`), {
        type: 'info',
      })
    } catch (e: any) {
      const {raw, clean} = cleanError(e)
      toast.show(clean || raw || e, {
        type: 'error',
      })
    }
  }

  return (
    <View
      style={[
        a.flex_row,
        a.align_start,
        a.px_xl,
        a.py_lg,
        a.gap_sm,
        !hideTopBorder && a.border_t,
        t.atoms.border_contrast_low,
      ]}>
      <Skele.Circle size={42}>
        <QuestionIcon size="lg" fill={t.atoms.text_contrast_low.color} />
      </Skele.Circle>
      <View style={[a.flex_1, a.gap_2xs]}>
        <View style={[a.flex_row, a.gap_xs]}>
          <Skele.Text style={[a.text_md, {width: 80}]} />
          <Skele.Text style={[a.text_md, {width: 100}]} />
        </View>

        <Text
          style={[
            a.text_md,
            a.leading_snug,
            a.italic,
            t.atoms.text_contrast_medium,
          ]}>
          <Trans>This post was deleted by its author</Trans>
        </Text>
      </View>
      <Button
        label={_(msg`Remove from saved posts`)}
        size="tiny"
        color="secondary"
        onPress={remove}>
        <ButtonIcon icon={BookmarkFilled} />
        <ButtonText>
          <Trans>Remove</Trans>
        </ButtonText>
      </Button>
    </View>
  )
}

function BookmarksEmpty() {
  const t = useTheme()
  const {_} = useLingui()
  const navigation = useNavigation<NavigationProp<CommonNavigatorParams>>()

  return (
    <EmptyState
      icon={BookmarkDeleteLarge}
      message={_(msg`Nothing saved yet`)}
      textStyle={[t.atoms.text_contrast_medium, a.font_medium]}
      button={{
        label: _(msg`Button to go back to the home timeline`),
        text: _(msg`Go home`),
        onPress: () => navigation.navigate('Home' as never),
        size: 'small',
        color: 'secondary',
      }}
      style={[a.pt_3xl]}
    />
  )
}

function renderItem({item, index}: {item: ListItem; index: number}) {
  switch (item.type) {
    case 'loading': {
      return <PostFeedLoadingPlaceholder />
    }
    case 'empty': {
      return <BookmarksEmpty />
    }
    case 'bookmark': {
      return (
        <Post
          post={item.bookmark.item}
          hideTopBorder={index === 0}
          onBeforePress={() => {
            logger.metric('bookmarks:post-clicked', {})
          }}
        />
      )
    }
    case 'bookmarkNotFound': {
      return (
        <BookmarkNotFound
          post={item.bookmark.item}
          hideTopBorder={index === 0}
        />
      )
    }
    default:
      return null
  }
}

const keyExtractor = (item: ListItem) => item.key
