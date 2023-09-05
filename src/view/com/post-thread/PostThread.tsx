import React, {useRef} from 'react'
import {runInAction} from 'mobx'
import {observer} from 'mobx-react-lite'
import {
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import {AppBskyFeedDefs} from '@atproto/api'
import {CenteredView, FlatList} from '../util/Views'
import {PostThreadModel} from 'state/models/content/post-thread'
import {PostThreadItemModel} from 'state/models/content/post-thread-item'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {PostThreadItem} from './PostThreadItem'
import {ComposePrompt} from '../composer/Prompt'
import {ViewHeader} from '../util/ViewHeader'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {Text} from '../util/text/Text'
import {s} from 'lib/styles'
import {isNative, isDesktopWeb} from 'platform/detection'
import {usePalette} from 'lib/hooks/usePalette'
import {useSetTitle} from 'lib/hooks/useSetTitle'
import {useNavigation} from '@react-navigation/native'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {NavigationProp} from 'lib/routes/types'
import {sanitizeDisplayName} from 'lib/strings/display-names'

const MAINTAIN_VISIBLE_CONTENT_POSITION = {minIndexForVisible: 2}

const TOP_COMPONENT = {
  _reactKey: '__top_component__',
  _isHighlightedPost: false,
}
const PARENT_SPINNER = {
  _reactKey: '__parent_spinner__',
  _isHighlightedPost: false,
}
const REPLY_PROMPT = {_reactKey: '__reply__', _isHighlightedPost: false}
const DELETED = {_reactKey: '__deleted__', _isHighlightedPost: false}
const BLOCKED = {_reactKey: '__blocked__', _isHighlightedPost: false}
const CHILD_SPINNER = {
  _reactKey: '__child_spinner__',
  _isHighlightedPost: false,
}
const BOTTOM_COMPONENT = {
  _reactKey: '__bottom_component__',
  _isHighlightedPost: false,
}
type YieldedItem =
  | PostThreadItemModel
  | typeof TOP_COMPONENT
  | typeof PARENT_SPINNER
  | typeof REPLY_PROMPT
  | typeof DELETED
  | typeof BLOCKED
  | typeof PARENT_SPINNER

export const PostThread = observer(function PostThread({
  uri,
  view,
  onPressReply,
}: {
  uri: string
  view: PostThreadModel
  onPressReply: () => void
}) {
  const pal = usePalette('default')
  const {isTablet} = useWebMediaQueries()
  const ref = useRef<FlatList>(null)
  const hasScrolledIntoView = useRef<boolean>(false)
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const navigation = useNavigation<NavigationProp>()
  const posts = React.useMemo(() => {
    if (view.thread) {
      const arr = [TOP_COMPONENT].concat(Array.from(flattenThread(view.thread)))
      if (view.isLoadingFromCache) {
        if (view.thread?.postRecord?.reply) {
          arr.unshift(PARENT_SPINNER)
        }
        arr.push(CHILD_SPINNER)
      } else {
        arr.push(BOTTOM_COMPONENT)
      }
      return arr
    }
    return []
  }, [view.isLoadingFromCache, view.thread])
  useSetTitle(
    view.thread?.postRecord &&
      `${sanitizeDisplayName(
        view.thread.post.author.displayName ||
          `@${view.thread.post.author.handle}`,
      )}: "${view.thread?.postRecord?.text}"`,
  )

  // events
  // =

  const onRefresh = React.useCallback(async () => {
    setIsRefreshing(true)
    try {
      view?.refresh()
    } catch (err) {
      view.rootStore.log.error('Failed to refresh posts thread', err)
    }
    setIsRefreshing(false)
  }, [view, setIsRefreshing])

  const onContentSizeChange = React.useCallback(() => {
    // only run once
    if (hasScrolledIntoView.current) {
      return
    }

    // wait for loading to finish
    if (
      !view.hasContent ||
      (view.isFromCache && view.isLoadingFromCache) ||
      view.isLoading
    ) {
      return
    }

    const index = posts.findIndex(post => post._isHighlightedPost)
    if (index !== -1) {
      ref.current?.scrollToIndex({
        index,
        animated: false,
        viewPosition: 0,
      })
      hasScrolledIntoView.current = true
    }
  }, [
    posts,
    view.hasContent,
    view.isFromCache,
    view.isLoadingFromCache,
    view.isLoading,
  ])
  const onScrollToIndexFailed = React.useCallback(
    (info: {
      index: number
      highestMeasuredFrameIndex: number
      averageItemLength: number
    }) => {
      ref.current?.scrollToOffset({
        animated: false,
        offset: info.averageItemLength * info.index,
      })
    },
    [ref],
  )

  const onPressBack = React.useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack()
    } else {
      navigation.navigate('Home')
    }
  }, [navigation])

  const renderItem = React.useCallback(
    ({item, index}: {item: YieldedItem; index: number}) => {
      if (item === TOP_COMPONENT) {
        return isTablet ? <ViewHeader title="Post" /> : null
      } else if (item === PARENT_SPINNER) {
        return (
          <View style={styles.parentSpinner}>
            <ActivityIndicator />
          </View>
        )
      } else if (item === REPLY_PROMPT) {
        return <ComposePrompt onPressCompose={onPressReply} />
      } else if (item === DELETED) {
        return (
          <View style={[pal.border, pal.viewLight, styles.missingItem]}>
            <Text type="lg-bold" style={pal.textLight}>
              Deleted post.
            </Text>
          </View>
        )
      } else if (item === BLOCKED) {
        return (
          <View style={[pal.border, pal.viewLight, styles.missingItem]}>
            <Text type="lg-bold" style={pal.textLight}>
              Blocked post.
            </Text>
          </View>
        )
      } else if (item === BOTTOM_COMPONENT) {
        // HACK
        // due to some complexities with how flatlist works, this is the easiest way
        // I could find to get a border positioned directly under the last item
        // -prf
        return <View style={[pal.border, styles.bottomSpacer]} />
      } else if (item === CHILD_SPINNER) {
        return (
          <View style={styles.childSpinner}>
            <ActivityIndicator />
          </View>
        )
      } else if (item instanceof PostThreadItemModel) {
        const prev = (
          index - 1 >= 0 ? posts[index - 1] : undefined
        ) as PostThreadItemModel
        return (
          <PostThreadItem
            item={item}
            onPostReply={onRefresh}
            hasPrecedingItem={prev?._showChildReplyLine}
          />
        )
      }
      return <></>
    },
    [onRefresh, onPressReply, pal, posts, isTablet],
  )

  // loading
  // =
  if (
    !view.hasLoaded ||
    (view.isLoading && !view.isRefreshing) ||
    view.params.uri !== uri
  ) {
    return (
      <CenteredView>
        <View style={s.p20}>
          <ActivityIndicator size="large" />
        </View>
      </CenteredView>
    )
  }

  // error
  // =
  if (view.hasError) {
    if (view.notFound) {
      return (
        <CenteredView>
          <View style={[pal.view, pal.border, styles.notFoundContainer]}>
            <Text type="title-lg" style={[pal.text, s.mb5]}>
              Post not found
            </Text>
            <Text type="md" style={[pal.text, s.mb10]}>
              The post may have been deleted.
            </Text>
            <TouchableOpacity
              onPress={onPressBack}
              accessibilityRole="button"
              accessibilityLabel="Back"
              accessibilityHint="">
              <Text type="2xl" style={pal.link}>
                <FontAwesomeIcon
                  icon="angle-left"
                  style={[pal.link as FontAwesomeIconStyle, s.mr5]}
                  size={14}
                />
                Back
              </Text>
            </TouchableOpacity>
          </View>
        </CenteredView>
      )
    }
    return (
      <CenteredView>
        <ErrorMessage message={view.error} onPressTryAgain={onRefresh} />
      </CenteredView>
    )
  }
  if (view.isBlocked) {
    return (
      <CenteredView>
        <View style={[pal.view, pal.border, styles.notFoundContainer]}>
          <Text type="title-lg" style={[pal.text, s.mb5]}>
            Post hidden
          </Text>
          <Text type="md" style={[pal.text, s.mb10]}>
            You have blocked the author or you have been blocked by the author.
          </Text>
          <TouchableOpacity
            onPress={onPressBack}
            accessibilityRole="button"
            accessibilityLabel="Back"
            accessibilityHint="">
            <Text type="2xl" style={pal.link}>
              <FontAwesomeIcon
                icon="angle-left"
                style={[pal.link as FontAwesomeIconStyle, s.mr5]}
                size={14}
              />
              Back
            </Text>
          </TouchableOpacity>
        </View>
      </CenteredView>
    )
  }

  // loaded
  // =
  return (
    <FlatList
      ref={ref}
      data={posts}
      initialNumToRender={posts.length}
      maintainVisibleContentPosition={
        isNative && view.isFromCache
          ? MAINTAIN_VISIBLE_CONTENT_POSITION
          : undefined
      }
      keyExtractor={item => item._reactKey}
      renderItem={renderItem}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={pal.colors.text}
          titleColor={pal.colors.text}
        />
      }
      onContentSizeChange={
        isNative && view.isFromCache ? undefined : onContentSizeChange
      }
      onScrollToIndexFailed={onScrollToIndexFailed}
      style={s.hContentRegion}
    />
  )
})

function* flattenThread(
  post: PostThreadItemModel,
  isAscending = false,
): Generator<YieldedItem, void> {
  if (post.parent) {
    if (AppBskyFeedDefs.isNotFoundPost(post.parent)) {
      yield DELETED
    } else if (AppBskyFeedDefs.isBlockedPost(post.parent)) {
      yield BLOCKED
    } else {
      yield* flattenThread(post.parent as PostThreadItemModel, true)
    }
  }
  yield post
  if (isDesktopWeb && post._isHighlightedPost) {
    yield REPLY_PROMPT
  }
  if (post.replies?.length) {
    for (const reply of post.replies) {
      if (AppBskyFeedDefs.isNotFoundPost(reply)) {
        yield DELETED
      } else {
        yield* flattenThread(reply as PostThreadItemModel)
      }
    }
  } else if (!isAscending && !post.parent && post.post.replyCount) {
    runInAction(() => {
      post._hasMore = true
    })
  }
}

const styles = StyleSheet.create({
  notFoundContainer: {
    margin: 10,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 6,
  },
  missingItem: {
    borderTop: 1,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  parentSpinner: {
    paddingVertical: 10,
  },
  childSpinner: {},
  bottomSpacer: {
    height: 400,
    borderTopWidth: 1,
  },
})
