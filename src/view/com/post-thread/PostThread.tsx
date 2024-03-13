import React, {useEffect, useRef} from 'react'
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import {AppBskyFeedDefs} from '@atproto/api'
import {CenteredView} from '../util/Views'
import {LoadingScreen} from '../util/LoadingScreen'
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
  ThreadNotFound,
  ThreadBlocked,
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
  useModerationOpts,
  usePreferencesQuery,
} from '#/state/queries/preferences'
import {useSession} from '#/state/session'
import {isAndroid, isNative, isWeb} from '#/platform/detection'
import {moderatePost_wrapped as moderatePost} from '#/lib/moderatePost_wrapped'

// FlatList maintainVisibleContentPosition breaks if too many items
// are prepended. This seems to be an optimal number based on *shrug*.
const PARENTS_CHUNK_SIZE = 15

const MAINTAIN_VISIBLE_CONTENT_POSITION = {
  // We don't insert any elements before the root row while loading.
  // So the row we want to use as the scroll anchor is the first row.
  minIndexForVisible: 0,
}

const TOP_COMPONENT = {_reactKey: '__top_component__'}
const REPLY_PROMPT = {_reactKey: '__reply__'}
const CHILD_SPINNER = {_reactKey: '__child_spinner__'}
const LOAD_MORE = {_reactKey: '__load_more__'}
const BOTTOM_COMPONENT = {_reactKey: '__bottom_component__'}

type YieldedItem = ThreadPost | ThreadBlocked | ThreadNotFound
type RowItem =
  | YieldedItem
  // TODO: TS doesn't actually enforce it's one of these, it only enforces matching shape.
  | typeof TOP_COMPONENT
  | typeof REPLY_PROMPT
  | typeof CHILD_SPINNER
  | typeof LOAD_MORE
  | typeof BOTTOM_COMPONENT

type ThreadSkeletonParts = {
  parents: YieldedItem[]
  highlightedPost: ThreadNode
  replies: YieldedItem[]
}

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

  const moderationOpts = useModerationOpts()
  const isNoPwi = React.useMemo(() => {
    const mod =
      rootPost && moderationOpts
        ? moderatePost(rootPost, moderationOpts)
        : undefined

    const cause = mod?.content.cause

    return cause
      ? cause.type === 'label' && cause.labelDef.id === '!no-unauthenticated'
      : false
  }, [rootPost, moderationOpts])

  useSetTitle(
    rootPost && !isNoPwi
      ? `${sanitizeDisplayName(
          rootPost.author.displayName || `@${rootPost.author.handle}`,
        )}: "${rootPostRecord!.text}"`
      : '',
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
    return <LoadingScreen />
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
  const {isMobile, isTabletOrMobile} = useWebMediaQueries()
  const ref = useRef<ListMethods>(null)
  const highlightedPostRef = useRef<View | null>(null)
  const [maxParents, setMaxParents] = React.useState(
    isWeb ? Infinity : PARENTS_CHUNK_SIZE,
  )
  const [maxReplies, setMaxReplies] = React.useState(100)
  const treeView = React.useMemo(
    () => !!threadViewPrefs.lab_treeViewEnabled && hasBranchingReplies(thread),
    [threadViewPrefs, thread],
  )

  // On native, this is going to start out `true`. We'll toggle it to `false` after the initial render if flushed.
  // This ensures that the first render contains no parents--even if they are already available in the cache.
  // We need to delay showing them so that we can use maintainVisibleContentPosition to keep the main post on screen.
  // On the web this is not necessary because we can synchronously adjust the scroll in onContentSizeChange instead.
  const [deferParents, setDeferParents] = React.useState(isNative)

  const skeleton = React.useMemo(
    () =>
      createThreadSkeleton(
        sortThread(thread, threadViewPrefs),
        hasSession,
        treeView,
      ),
    [thread, threadViewPrefs, hasSession, treeView],
  )

  // construct content
  const posts = React.useMemo(() => {
    const {parents, highlightedPost, replies} = skeleton
    let arr: RowItem[] = []
    if (highlightedPost.type === 'post') {
      const isRoot =
        !highlightedPost.parent && !highlightedPost.ctx.isParentLoading
      if (isRoot) {
        // No parents to load.
        arr.push(TOP_COMPONENT)
      } else {
        if (highlightedPost.ctx.isParentLoading || deferParents) {
          // We're loading parents of the highlighted post.
          // In this case, we don't render anything above the post.
          // If you add something here, you'll need to update both
          // maintainVisibleContentPosition and onContentSizeChange
          // to "hold onto" the correct row instead of the first one.
        } else {
          // Everything is loaded
          let startIndex = Math.max(0, parents.length - maxParents)
          if (startIndex === 0) {
            arr.push(TOP_COMPONENT)
          } else {
            // When progressively revealing parents, rendering a placeholder
            // here will cause scrolling jumps. Don't add it unless you test it.
            // QT'ing this thread is a great way to test all the scrolling hacks:
            // https://bsky.app/profile/www.mozzius.dev/post/3kjqhblh6qk2o
          }
          for (let i = startIndex; i < parents.length; i++) {
            arr.push(parents[i])
          }
        }
      }
      arr.push(highlightedPost)
      if (!highlightedPost.post.viewer?.replyDisabled) {
        arr.push(REPLY_PROMPT)
      }
      if (highlightedPost.ctx.isChildLoading) {
        arr.push(CHILD_SPINNER)
      } else {
        for (let i = 0; i < replies.length; i++) {
          arr.push(replies[i])
          if (i === maxReplies) {
            arr.push(LOAD_MORE)
            break
          }
        }
        arr.push(BOTTOM_COMPONENT)
      }
    }
    return arr
  }, [skeleton, deferParents, maxParents, maxReplies])

  // This is only used on the web to keep the post in view when its parents load.
  // On native, we rely on `maintainVisibleContentPosition` instead.
  const didAdjustScrollWeb = useRef<boolean>(false)
  const onContentSizeChangeWeb = React.useCallback(() => {
    // only run once
    if (didAdjustScrollWeb.current) {
      return
    }
    // wait for loading to finish
    if (thread.type === 'post' && !!thread.parent) {
      function onMeasure(pageY: number) {
        ref.current?.scrollToOffset({
          animated: false,
          offset: pageY,
        })
      }
      // Measure synchronously to avoid a layout jump.
      const domNode = highlightedPostRef.current
      if (domNode) {
        const pageY = (domNode as any as Element).getBoundingClientRect().top
        onMeasure(pageY)
      }
      didAdjustScrollWeb.current = true
    }
  }, [thread])

  // On native, we reveal parents in chunks. Although they're all already
  // loaded and FlatList already has its own virtualization, unfortunately FlatList
  // has a bug that causes the content to jump around if too many items are getting
  // prepended at once. It also jumps around if items get prepended during scroll.
  // To work around this, we prepend rows after scroll bumps against the top and rests.
  const needsBumpMaxParents = React.useRef(false)
  const onStartReached = React.useCallback(() => {
    if (maxParents < skeleton.parents.length) {
      needsBumpMaxParents.current = true
    }
  }, [maxParents, skeleton.parents.length])
  const bumpMaxParentsIfNeeded = React.useCallback(() => {
    if (!isNative) {
      return
    }
    if (needsBumpMaxParents.current) {
      needsBumpMaxParents.current = false
      setMaxParents(n => n + PARENTS_CHUNK_SIZE)
    }
  }, [])
  const onMomentumScrollEnd = bumpMaxParentsIfNeeded
  const onScrollToTop = bumpMaxParentsIfNeeded

  const renderItem = React.useCallback(
    ({item, index}: {item: RowItem; index: number}) => {
      if (item === TOP_COMPONENT) {
        return isTabletOrMobile ? (
          <ViewHeader
            title={_(msg({message: `Post`, context: 'description'}))}
          />
        ) : null
      } else if (item === REPLY_PROMPT && hasSession) {
        return (
          <View>
            {!isMobile && <ComposePrompt onPressCompose={onPressReply} />}
          </View>
        )
      } else if (isThreadNotFound(item)) {
        return (
          <View style={[pal.border, pal.viewLight, styles.itemContainer]}>
            <Text type="lg-bold" style={pal.textLight}>
              <Trans>Deleted post.</Trans>
            </Text>
          </View>
        )
      } else if (isThreadBlocked(item)) {
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
            onPress={() => setMaxReplies(n => n + 50)}
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
            // @ts-ignore web-only
            style={{
              // Leave enough space below that the scroll doesn't jump
              height: isNative ? 600 : '100vh',
              borderTopWidth: 1,
              borderColor: pal.colors.border,
            }}
          />
        )
      } else if (item === CHILD_SPINNER) {
        return (
          <View style={[pal.border, styles.childSpinner]}>
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
        const hasUnrevealedParents =
          index === 0 && maxParents < skeleton.parents.length
        return (
          <View
            ref={item.ctx.isHighlightedPost ? highlightedPostRef : undefined}
            onLayout={deferParents ? () => setDeferParents(false) : undefined}>
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
              hasPrecedingItem={
                !!prev?.ctx.showChildReplyLine || hasUnrevealedParents
              }
              onPostReply={onRefresh}
            />
          </View>
        )
      }
      return null
    },
    [
      hasSession,
      isTabletOrMobile,
      isMobile,
      onPressReply,
      pal.border,
      pal.viewLight,
      pal.textLight,
      pal.view,
      pal.text,
      pal.colors.border,
      posts,
      onRefresh,
      deferParents,
      treeView,
      skeleton.parents.length,
      maxParents,
      _,
    ],
  )

  return (
    <List
      ref={ref}
      data={posts}
      keyExtractor={item => item._reactKey}
      renderItem={renderItem}
      onContentSizeChange={isNative ? undefined : onContentSizeChangeWeb}
      onStartReached={onStartReached}
      onMomentumScrollEnd={onMomentumScrollEnd}
      onScrollToTop={onScrollToTop}
      maintainVisibleContentPosition={
        isNative ? MAINTAIN_VISIBLE_CONTENT_POSITION : undefined
      }
      style={s.hContentRegion}
      // @ts-ignore our .web version only -prf
      desktopFixedHeight
      removeClippedSubviews={isAndroid ? false : undefined}
      windowSize={11}
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
            <Trans context="action">Back</Trans>
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

function isThreadNotFound(v: unknown): v is ThreadNotFound {
  return !!v && typeof v === 'object' && 'type' in v && v.type === 'not-found'
}

function isThreadBlocked(v: unknown): v is ThreadBlocked {
  return !!v && typeof v === 'object' && 'type' in v && v.type === 'blocked'
}

function createThreadSkeleton(
  node: ThreadNode,
  hasSession: boolean,
  treeView: boolean,
): ThreadSkeletonParts {
  return {
    parents: Array.from(flattenThreadParents(node, hasSession)),
    highlightedPost: node,
    replies: Array.from(flattenThreadReplies(node, hasSession, treeView)),
  }
}

function* flattenThreadParents(
  node: ThreadNode,
  hasSession: boolean,
): Generator<YieldedItem, void> {
  if (node.type === 'post') {
    if (node.parent) {
      yield* flattenThreadParents(node.parent, hasSession)
    }
    if (!node.ctx.isHighlightedPost) {
      yield node
    }
  } else if (node.type === 'not-found') {
    yield node
  } else if (node.type === 'blocked') {
    yield node
  }
}

function* flattenThreadReplies(
  node: ThreadNode,
  hasSession: boolean,
  treeView: boolean,
): Generator<YieldedItem, void> {
  if (node.type === 'post') {
    if (!hasSession && hasPwiOptOut(node)) {
      return
    }
    if (!node.ctx.isHighlightedPost) {
      yield node
    }
    if (node.replies?.length) {
      for (const reply of node.replies) {
        yield* flattenThreadReplies(reply, hasSession, treeView)
        if (!treeView && !node.ctx.isHighlightedPost) {
          break
        }
      }
    }
  } else if (node.type === 'not-found') {
    yield node
  } else if (node.type === 'blocked') {
    yield node
  }
}

function hasPwiOptOut(node: ThreadPost) {
  return !!node.post.author.labels?.find(l => l.val === '!no-unauthenticated')
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
  childSpinner: {
    borderTopWidth: 1,
    paddingTop: 40,
    paddingBottom: 200,
  },
})
