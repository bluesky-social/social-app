import React, {useEffect, useRef} from 'react'
import {StyleSheet, useWindowDimensions, View} from 'react-native'
import {AppBskyFeedDefs} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {moderatePost_wrapped as moderatePost} from '#/lib/moderatePost_wrapped'
import {isAndroid, isNative, isWeb} from '#/platform/detection'
import {
  sortThread,
  ThreadBlocked,
  ThreadNode,
  ThreadNotFound,
  ThreadPost,
  usePostThreadQuery,
} from '#/state/queries/post-thread'
import {
  useModerationOpts,
  usePreferencesQuery,
} from '#/state/queries/preferences'
import {useSession} from '#/state/session'
import {useInitialNumToRender} from 'lib/hooks/useInitialNumToRender'
import {usePalette} from 'lib/hooks/usePalette'
import {useSetTitle} from 'lib/hooks/useSetTitle'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {sanitizeDisplayName} from 'lib/strings/display-names'
import {cleanError} from 'lib/strings/errors'
import {ListFooter, ListMaybePlaceholder} from '#/components/Lists'
import {ComposePrompt} from '../composer/Prompt'
import {List, ListMethods} from '../util/List'
import {Text} from '../util/text/Text'
import {ViewHeader} from '../util/ViewHeader'
import {PostThreadItem} from './PostThreadItem'

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
const LOAD_MORE = {_reactKey: '__load_more__'}

type YieldedItem = ThreadPost | ThreadBlocked | ThreadNotFound
type RowItem =
  | YieldedItem
  // TODO: TS doesn't actually enforce it's one of these, it only enforces matching shape.
  | typeof TOP_COMPONENT
  | typeof REPLY_PROMPT
  | typeof LOAD_MORE

type ThreadSkeletonParts = {
  parents: YieldedItem[]
  highlightedPost: ThreadNode
  replies: YieldedItem[]
}

const keyExtractor = (item: RowItem) => {
  return item._reactKey
}

export function PostThread({
  uri,
  onCanReply,
  onPressReply,
}: {
  uri: string | undefined
  onCanReply: (canReply: boolean) => void
  onPressReply: () => unknown
}) {
  const {hasSession} = useSession()
  const {_} = useLingui()
  const pal = usePalette('default')
  const {isMobile, isTabletOrMobile} = useWebMediaQueries()
  const initialNumToRender = useInitialNumToRender()
  const {height: windowHeight} = useWindowDimensions()

  const {data: preferences} = usePreferencesQuery()
  const {
    isFetching,
    isError: isThreadError,
    error: threadError,
    refetch,
    data: thread,
  } = usePostThreadQuery(uri)

  const treeView = React.useMemo(
    () =>
      !!preferences?.threadViewPrefs?.lab_treeViewEnabled &&
      hasBranchingReplies(thread),
    [preferences?.threadViewPrefs, thread],
  )
  const rootPost = thread?.type === 'post' ? thread.post : undefined
  const rootPostRecord = thread?.type === 'post' ? thread.record : undefined

  const moderationOpts = useModerationOpts()
  const isNoPwi = React.useMemo(() => {
    const mod =
      rootPost && moderationOpts
        ? moderatePost(rootPost, moderationOpts)
        : undefined
    return !!mod
      ?.ui('contentList')
      .blurs.find(
        cause =>
          cause.type === 'label' &&
          cause.labelDef.identifier === '!no-unauthenticated',
      )
  }, [rootPost, moderationOpts])

  // Values used for proper rendering of parents
  const ref = useRef<ListMethods>(null)
  const highlightedPostRef = useRef<View | null>(null)
  const [maxParents, setMaxParents] = React.useState(
    isWeb ? Infinity : PARENTS_CHUNK_SIZE,
  )
  const [maxReplies, setMaxReplies] = React.useState(50)

  useSetTitle(
    rootPost && !isNoPwi
      ? `${sanitizeDisplayName(
          rootPost.author.displayName || `@${rootPost.author.handle}`,
        )}: "${rootPostRecord!.text}"`
      : '',
  )

  // On native, this is going to start out `true`. We'll toggle it to `false` after the initial render if flushed.
  // This ensures that the first render contains no parents--even if they are already available in the cache.
  // We need to delay showing them so that we can use maintainVisibleContentPosition to keep the main post on screen.
  // On the web this is not necessary because we can synchronously adjust the scroll in onContentSizeChange instead.
  const [deferParents, setDeferParents] = React.useState(isNative)

  const skeleton = React.useMemo(() => {
    const threadViewPrefs = preferences?.threadViewPrefs
    if (!threadViewPrefs || !thread) return null

    return createThreadSkeleton(
      sortThread(thread, threadViewPrefs),
      hasSession,
      treeView,
    )
  }, [thread, preferences?.threadViewPrefs, hasSession, treeView])

  const error = React.useMemo(() => {
    if (AppBskyFeedDefs.isNotFoundPost(thread)) {
      return {
        title: _(msg`Post not found`),
        message: _(msg`The post may have been deleted.`),
      }
    } else if (skeleton?.highlightedPost.type === 'blocked') {
      return {
        title: _(msg`Post hidden`),
        message: _(
          msg`You have blocked the author or you have been blocked by the author.`,
        ),
      }
    } else if (threadError?.message.startsWith('Post not found')) {
      return {
        title: _(msg`Post not found`),
        message: _(msg`The post may have been deleted.`),
      }
    } else if (isThreadError) {
      return {
        message: threadError ? cleanError(threadError) : undefined,
      }
    }

    return null
  }, [thread, skeleton?.highlightedPost, isThreadError, _, threadError])

  useEffect(() => {
    if (error) {
      onCanReply(false)
    } else if (rootPost) {
      onCanReply(!rootPost.viewer?.replyDisabled)
    }
  }, [rootPost, onCanReply, error])

  // construct content
  const posts = React.useMemo(() => {
    if (!skeleton) return []

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
      for (let i = 0; i < replies.length; i++) {
        arr.push(replies[i])
        if (i === maxReplies) {
          break
        }
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
    if (thread?.type === 'post' && !!thread.parent) {
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
    if (skeleton?.parents && maxParents < skeleton.parents.length) {
      needsBumpMaxParents.current = true
    }
  }, [maxParents, skeleton?.parents])
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

  const onEndReached = React.useCallback(() => {
    if (isFetching || posts.length < maxReplies) return
    setMaxReplies(prev => prev + 50)
  }, [isFetching, maxReplies, posts.length])

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
      } else if (isThreadPost(item)) {
        const prev = isThreadPost(posts[index - 1])
          ? (posts[index - 1] as ThreadPost)
          : undefined
        const next = isThreadPost(posts[index - 1])
          ? (posts[index - 1] as ThreadPost)
          : undefined
        const hasUnrevealedParents =
          index === 0 &&
          skeleton?.parents &&
          maxParents < skeleton.parents.length
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
                !!prev?.ctx.showChildReplyLine || !!hasUnrevealedParents
              }
              onPostReply={refetch}
            />
          </View>
        )
      }
      return null
    },
    [
      hasSession,
      isTabletOrMobile,
      _,
      isMobile,
      onPressReply,
      pal.border,
      pal.viewLight,
      pal.textLight,
      posts,
      skeleton?.parents,
      maxParents,
      deferParents,
      treeView,
      refetch,
    ],
  )

  return (
    <>
      <ListMaybePlaceholder
        isLoading={(!preferences || !thread) && !error}
        isError={!!error}
        onRetry={refetch}
        errorTitle={error?.title}
        errorMessage={error?.message}
      />
      {!error && thread && (
        <List
          ref={ref}
          data={posts}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          onContentSizeChange={isNative ? undefined : onContentSizeChangeWeb}
          onStartReached={onStartReached}
          onEndReached={onEndReached}
          onEndReachedThreshold={2}
          onMomentumScrollEnd={onMomentumScrollEnd}
          onScrollToTop={onScrollToTop}
          maintainVisibleContentPosition={
            isNative ? MAINTAIN_VISIBLE_CONTENT_POSITION : undefined
          }
          // @ts-ignore our .web version only -prf
          desktopFixedHeight
          removeClippedSubviews={isAndroid ? false : undefined}
          ListFooterComponent={
            <ListFooter
              isFetching={isFetching}
              onRetry={refetch}
              // 300 is based on the minimum height of a post. This is enough extra height for the `maintainVisPos` to
              // work without causing weird jumps on web or glitches on native
              height={windowHeight - 200}
            />
          }
          initialNumToRender={initialNumToRender}
          windowSize={11}
        />
      )}
    </>
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
): ThreadSkeletonParts | null {
  if (!node) return null

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

function hasBranchingReplies(node?: ThreadNode) {
  if (!node) {
    return false
  }
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
  itemContainer: {
    borderTopWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
})
