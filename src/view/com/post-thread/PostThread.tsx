import React, {useEffect, useRef} from 'react'
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import {AppBskyFeedDefs} from '@atproto/api'
import {CenteredView} from '../util/Views'
import {List, ListMethods} from '../util/List'
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
import {usePalette} from 'lib/hooks/usePalette'
import {useSetTitle} from 'lib/hooks/useSetTitle'
import {
  ThreadNode,
  ThreadPost,
  usePostThreadQuery,
  sortThread,
} from '#/state/queries/post-thread'
import {useNavigation} from '@react-navigation/native'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {NavigationProp} from 'lib/routes/types'
import {sanitizeDisplayName} from 'lib/strings/display-names'
import {cleanError} from '#/lib/strings/errors'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {
  UsePreferencesQueryResponse,
  usePreferencesQuery,
} from '#/state/queries/preferences'
import {useSession} from '#/state/session'
import {isNative} from '#/platform/detection'
import {logger} from '#/logger'

const MAINTAIN_VISIBLE_CONTENT_POSITION = {minIndexForVisible: 2}

const TOP_COMPONENT = {_reactKey: '__top_component__'}
const PARENT_SPINNER = {_reactKey: '__parent_spinner__'}
const REPLY_PROMPT = {_reactKey: '__reply__'}
const DELETED = {_reactKey: '__deleted__'}
const BLOCKED = {_reactKey: '__blocked__'}
const CHILD_SPINNER = {_reactKey: '__child_spinner__'}
const LOAD_MORE = {_reactKey: '__load_more__'}
const BOTTOM_COMPONENT = {_reactKey: '__bottom_component__'}

type YieldedItem =
  | ThreadPost
  | typeof TOP_COMPONENT
  | typeof PARENT_SPINNER
  | typeof REPLY_PROMPT
  | typeof DELETED
  | typeof BLOCKED
  | typeof PARENT_SPINNER

export function PostThread({
  uri,
  onCanReply,
  onPressReply,
}: {
  uri: string | undefined
  onCanReply: (canReply: boolean) => void
  onPressReply: () => void
}) {
  const {
    isLoading,
    isError,
    error,
    refetch,
    data: thread,
  } = usePostThreadQuery(uri)
  const {data: preferences} = usePreferencesQuery()
  const rootPost = thread?.type === 'post' ? thread.post : undefined
  const rootPostRecord = thread?.type === 'post' ? thread.record : undefined

  useSetTitle(
    rootPost &&
      `${sanitizeDisplayName(
        rootPost.author.displayName || `@${rootPost.author.handle}`,
      )}: "${rootPostRecord?.text}"`,
  )
  useEffect(() => {
    if (rootPost) {
      onCanReply(!rootPost.viewer?.replyDisabled)
    }
  }, [rootPost, onCanReply])

  if (isError || AppBskyFeedDefs.isNotFoundPost(thread)) {
    return (
      <PostThreadError
        error={error}
        notFound={AppBskyFeedDefs.isNotFoundPost(thread)}
        onRefresh={refetch}
      />
    )
  }
  if (AppBskyFeedDefs.isBlockedPost(thread)) {
    return <PostThreadBlocked />
  }
  if (!thread || isLoading || !preferences) {
    return (
      <CenteredView>
        <View style={s.p20}>
          <ActivityIndicator size="large" />
        </View>
      </CenteredView>
    )
  }
  return (
    <PostThreadLoaded
      thread={thread}
      threadViewPrefs={preferences.threadViewPrefs}
      onRefresh={refetch}
      onPressReply={onPressReply}
    />
  )
}

function PostThreadLoaded({
  thread,
  threadViewPrefs,
  onRefresh,
  onPressReply,
}: {
  thread: ThreadNode
  threadViewPrefs: UsePreferencesQueryResponse['threadViewPrefs']
  onRefresh: () => void
  onPressReply: () => void
}) {
  const {hasSession} = useSession()
  const {_} = useLingui()
  const pal = usePalette('default')
  const {isTablet, isDesktop} = useWebMediaQueries()
  const ref = useRef<ListMethods>(null)
  const highlightedPostRef = useRef<View | null>(null)
  const needsScrollAdjustment = useRef<boolean>(
    !isNative || // web always uses scroll adjustment
      (thread.type === 'post' && !thread.ctx.isParentLoading), // native only does it when not loading from placeholder
  )
  const [maxVisible, setMaxVisible] = React.useState(100)
  const [isPTRing, setIsPTRing] = React.useState(false)
  const treeView = React.useMemo(
    () => !!threadViewPrefs.lab_treeViewEnabled && hasBranchingReplies(thread),
    [threadViewPrefs, thread],
  )

  // construct content
  const posts = React.useMemo(() => {
    let arr = [TOP_COMPONENT].concat(
      Array.from(flattenThreadSkeleton(sortThread(thread, threadViewPrefs))),
    )
    if (arr.length > maxVisible) {
      arr = arr.slice(0, maxVisible).concat([LOAD_MORE])
    }
    if (arr.indexOf(CHILD_SPINNER) === -1) {
      arr.push(BOTTOM_COMPONENT)
    }
    return arr
  }, [thread, maxVisible, threadViewPrefs])

  /**
   * NOTE
   * Scroll positioning
   *
   * This callback is run if needsScrollAdjustment.current == true, which is...
   *  - On web: always
   *  - On native: when the placeholder cache is not being used
   *
   * It then only runs when viewing a reply, and the goal is to scroll the
   * reply into view.
   *
   * On native, if the placeholder cache is being used then maintainVisibleContentPosition
   * is a more effective solution, so we use that. Otherwise, typically we're loading from
   * the react-query cache, so we just need to immediately scroll down to the post.
   *
   * On desktop, maintainVisibleContentPosition isn't supported so we just always use
   * this technique.
   *
   * -prf
   */
  const onContentSizeChange = React.useCallback(() => {
    // only run once
    if (!needsScrollAdjustment.current) {
      return
    }

    // wait for loading to finish
    if (thread.type === 'post' && !!thread.parent) {
      highlightedPostRef.current?.measure(
        (_x, _y, _width, _height, _pageX, pageY) => {
          ref.current?.scrollToOffset({
            animated: false,
            offset: pageY - (isDesktop ? 0 : 50),
          })
        },
      )
      needsScrollAdjustment.current = false
    }
  }, [thread, isDesktop])

  const onPTR = React.useCallback(async () => {
    setIsPTRing(true)
    try {
      await onRefresh()
    } catch (err) {
      logger.error('Failed to refresh posts thread', {error: err})
    }
    setIsPTRing(false)
  }, [setIsPTRing, onRefresh])

  const renderItem = React.useCallback(
    ({item, index}: {item: YieldedItem; index: number}) => {
      if (item === TOP_COMPONENT) {
        return isTablet ? <ViewHeader title={_(msg`Post`)} /> : null
      } else if (item === PARENT_SPINNER) {
        return (
          <View style={styles.parentSpinner}>
            <ActivityIndicator />
          </View>
        )
      } else if (item === REPLY_PROMPT && hasSession) {
        return (
          <View>
            {isDesktop && <ComposePrompt onPressCompose={onPressReply} />}
          </View>
        )
      } else if (item === DELETED) {
        return (
          <View style={[pal.border, pal.viewLight, styles.itemContainer]}>
            <Text type="lg-bold" style={pal.textLight}>
              <Trans>Deleted post.</Trans>
            </Text>
          </View>
        )
      } else if (item === BLOCKED) {
        return (
          <View style={[pal.border, pal.viewLight, styles.itemContainer]}>
            <Text type="lg-bold" style={pal.textLight}>
              <Trans>Blocked post.</Trans>
            </Text>
          </View>
        )
      } else if (item === LOAD_MORE) {
        return (
          <Pressable
            onPress={() => setMaxVisible(n => n + 50)}
            style={[pal.border, pal.view, styles.itemContainer]}
            accessibilityLabel={_(msg`Load more posts`)}
            accessibilityHint="">
            <View
              style={[
                pal.viewLight,
                {paddingHorizontal: 18, paddingVertical: 14, borderRadius: 6},
              ]}>
              <Text type="lg-medium" style={pal.text}>
                <Trans>Load more posts</Trans>
              </Text>
            </View>
          </Pressable>
        )
      } else if (item === BOTTOM_COMPONENT) {
        // HACK
        // due to some complexities with how flatlist works, this is the easiest way
        // I could find to get a border positioned directly under the last item
        // -prf
        return (
          <View
            style={{
              height: 400,
              borderTopWidth: 1,
              borderColor: pal.colors.border,
            }}
          />
        )
      } else if (item === CHILD_SPINNER) {
        return (
          <View style={styles.childSpinner}>
            <ActivityIndicator />
          </View>
        )
      } else if (isThreadPost(item)) {
        const prev = isThreadPost(posts[index - 1])
          ? (posts[index - 1] as ThreadPost)
          : undefined
        const next = isThreadPost(posts[index - 1])
          ? (posts[index - 1] as ThreadPost)
          : undefined
        return (
          <View
            ref={item.ctx.isHighlightedPost ? highlightedPostRef : undefined}>
            <PostThreadItem
              post={item.post}
              record={item.record}
              treeView={treeView}
              depth={item.ctx.depth}
              prevPost={prev}
              nextPost={next}
              isHighlightedPost={item.ctx.isHighlightedPost}
              hasMore={item.ctx.hasMore}
              showChildReplyLine={item.ctx.showChildReplyLine}
              showParentReplyLine={item.ctx.showParentReplyLine}
              hasPrecedingItem={!!prev?.ctx.showChildReplyLine}
              onPostReply={onRefresh}
            />
          </View>
        )
      }
      return null
    },
    [
      hasSession,
      isTablet,
      isDesktop,
      onPressReply,
      pal.border,
      pal.viewLight,
      pal.textLight,
      pal.view,
      pal.text,
      pal.colors.border,
      posts,
      onRefresh,
      treeView,
      _,
    ],
  )

  return (
    <List
      ref={ref}
      data={posts}
      initialNumToRender={!isNative ? posts.length : undefined}
      maintainVisibleContentPosition={
        !needsScrollAdjustment.current
          ? MAINTAIN_VISIBLE_CONTENT_POSITION
          : undefined
      }
      keyExtractor={item => item._reactKey}
      renderItem={renderItem}
      refreshControl={
        <RefreshControl
          refreshing={isPTRing}
          onRefresh={onPTR}
          tintColor={pal.colors.text}
          titleColor={pal.colors.text}
        />
      }
      onContentSizeChange={onContentSizeChange}
      style={s.hContentRegion}
      // @ts-ignore our .web version only -prf
      desktopFixedHeight
    />
  )
}

function PostThreadBlocked() {
  const {_} = useLingui()
  const pal = usePalette('default')
  const navigation = useNavigation<NavigationProp>()

  const onPressBack = React.useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack()
    } else {
      navigation.navigate('Home')
    }
  }, [navigation])

  return (
    <CenteredView>
      <View style={[pal.view, pal.border, styles.notFoundContainer]}>
        <Text type="title-lg" style={[pal.text, s.mb5]}>
          <Trans>Post hidden</Trans>
        </Text>
        <Text type="md" style={[pal.text, s.mb10]}>
          <Trans>
            You have blocked the author or you have been blocked by the author.
          </Trans>
        </Text>
        <TouchableOpacity
          onPress={onPressBack}
          accessibilityRole="button"
          accessibilityLabel={_(msg`Back`)}
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

function PostThreadError({
  onRefresh,
  notFound,
  error,
}: {
  onRefresh: () => void
  notFound: boolean
  error: Error | null
}) {
  const {_} = useLingui()
  const pal = usePalette('default')
  const navigation = useNavigation<NavigationProp>()

  const onPressBack = React.useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack()
    } else {
      navigation.navigate('Home')
    }
  }, [navigation])

  if (notFound) {
    return (
      <CenteredView>
        <View style={[pal.view, pal.border, styles.notFoundContainer]}>
          <Text type="title-lg" style={[pal.text, s.mb5]}>
            <Trans>Post not found</Trans>
          </Text>
          <Text type="md" style={[pal.text, s.mb10]}>
            <Trans>The post may have been deleted.</Trans>
          </Text>
          <TouchableOpacity
            onPress={onPressBack}
            accessibilityRole="button"
            accessibilityLabel={_(msg`Back`)}
            accessibilityHint="">
            <Text type="2xl" style={pal.link}>
              <FontAwesomeIcon
                icon="angle-left"
                style={[pal.link as FontAwesomeIconStyle, s.mr5]}
                size={14}
              />
              <Trans>Back</Trans>
            </Text>
          </TouchableOpacity>
        </View>
      </CenteredView>
    )
  }
  return (
    <CenteredView>
      <ErrorMessage message={cleanError(error)} onPressTryAgain={onRefresh} />
    </CenteredView>
  )
}

function isThreadPost(v: unknown): v is ThreadPost {
  return !!v && typeof v === 'object' && 'type' in v && v.type === 'post'
}

function* flattenThreadSkeleton(
  node: ThreadNode,
): Generator<YieldedItem, void> {
  if (node.type === 'post') {
    if (node.parent) {
      yield* flattenThreadSkeleton(node.parent)
    } else if (node.ctx.isParentLoading) {
      yield PARENT_SPINNER
    }
    yield node
    if (node.ctx.isHighlightedPost && !node.post.viewer?.replyDisabled) {
      yield REPLY_PROMPT
    }
    if (node.replies?.length) {
      for (const reply of node.replies) {
        yield* flattenThreadSkeleton(reply)
      }
    } else if (node.ctx.isChildLoading) {
      yield CHILD_SPINNER
    }
  } else if (node.type === 'not-found') {
    yield DELETED
  } else if (node.type === 'blocked') {
    yield BLOCKED
  }
}

function hasBranchingReplies(node: ThreadNode) {
  if (node.type !== 'post') {
    return false
  }
  if (!node.replies) {
    return false
  }
  if (node.replies.length === 1) {
    return hasBranchingReplies(node.replies[0])
  }
  return true
}

const styles = StyleSheet.create({
  notFoundContainer: {
    margin: 10,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 6,
  },
  itemContainer: {
    borderTopWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  parentSpinner: {
    paddingVertical: 10,
  },
  childSpinner: {
    paddingBottom: 200,
  },
})
