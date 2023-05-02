import React, {useRef} from 'react'
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
import {
  PostThreadModel,
  PostThreadItemModel,
} from 'state/models/content/post-thread'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {PostThreadItem} from './PostThreadItem'
import {ComposePrompt} from '../composer/Prompt'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {Text} from '../util/text/Text'
import {s} from 'lib/styles'
import {isDesktopWeb, isMobileWeb} from 'platform/detection'
import {usePalette} from 'lib/hooks/usePalette'
import {useNavigation} from '@react-navigation/native'
import {NavigationProp} from 'lib/routes/types'

const REPLY_PROMPT = {_reactKey: '__reply__', _isHighlightedPost: false}
const DELETED = {_reactKey: '__deleted__', _isHighlightedPost: false}
const BLOCKED = {_reactKey: '__blocked__', _isHighlightedPost: false}
const BOTTOM_COMPONENT = {
  _reactKey: '__bottom_component__',
  _isHighlightedPost: false,
}
type YieldedItem =
  | PostThreadItemModel
  | typeof REPLY_PROMPT
  | typeof DELETED
  | typeof BLOCKED

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
  const ref = useRef<FlatList>(null)
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const navigation = useNavigation<NavigationProp>()
  const posts = React.useMemo(() => {
    if (view.thread) {
      return Array.from(flattenThread(view.thread)).concat([BOTTOM_COMPONENT])
    }
    return []
  }, [view.thread])

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

  const onLayout = React.useCallback(() => {
    const index = posts.findIndex(post => post._isHighlightedPost)
    if (index !== -1) {
      ref.current?.scrollToIndex({
        index,
        animated: false,
        viewOffset: 40,
      })
    }
  }, [posts, ref])

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
    ({item}: {item: YieldedItem}) => {
      if (item === REPLY_PROMPT) {
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
        // -
        // addendum -- it's also the best way to get mobile web to add padding
        // at the bottom of the thread since paddingbottom is ignored. yikes.
        // -prf
        return (
          <View
            style={[
              styles.bottomBorder,
              pal.border,
              isMobileWeb && styles.bottomSpacer,
            ]}
          />
        )
      } else if (item instanceof PostThreadItemModel) {
        return <PostThreadItem item={item} onPostReply={onRefresh} />
      }
      return <></>
    },
    [onRefresh, onPressReply, pal],
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
              accessibilityLabel="Go back"
              accessibilityHint="Navigates to the previous screen">
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
            accessibilityLabel="Go back"
            accessibilityHint="Navigates to the previous screen">
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
      onLayout={onLayout}
      onScrollToIndexFailed={onScrollToIndexFailed}
      style={s.hContentRegion}
      contentContainerStyle={s.contentContainerExtra}
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
    post._hasMore = true
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
  bottomBorder: {
    borderBottomWidth: 1,
  },
  bottomSpacer: {
    height: 200,
  },
})
