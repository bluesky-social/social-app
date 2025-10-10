import {useCallback, useMemo, useRef, useState} from 'react'
import {useWindowDimensions, View} from 'react-native'
import Animated, {useAnimatedStyle} from 'react-native-reanimated'
import {Trans} from '@lingui/macro'

import {useInitialNumToRender} from '#/lib/hooks/useInitialNumToRender'
import {useOpenComposer} from '#/lib/hooks/useOpenComposer'
import {useFeedFeedback} from '#/state/feed-feedback'
import {type ThreadViewOption} from '#/state/queries/preferences/useThreadPreferences'
import {type ThreadItem, usePostThread} from '#/state/queries/usePostThread'
import {useSession} from '#/state/session'
import {type OnPostSuccessData} from '#/state/shell/composer'
import {useShellLayout} from '#/state/shell/shell-layout'
import {useUnstablePostSource} from '#/state/unstable-post-source'
import {List, type ListMethods} from '#/view/com/util/List'
import {HeaderDropdown} from '#/screens/PostThread/components/HeaderDropdown'
import {ThreadComposePrompt} from '#/screens/PostThread/components/ThreadComposePrompt'
import {ThreadError} from '#/screens/PostThread/components/ThreadError'
import {
  ThreadItemAnchor,
  ThreadItemAnchorSkeleton,
} from '#/screens/PostThread/components/ThreadItemAnchor'
import {ThreadItemAnchorNoUnauthenticated} from '#/screens/PostThread/components/ThreadItemAnchorNoUnauthenticated'
import {
  ThreadItemPost,
  ThreadItemPostSkeleton,
} from '#/screens/PostThread/components/ThreadItemPost'
import {ThreadItemPostNoUnauthenticated} from '#/screens/PostThread/components/ThreadItemPostNoUnauthenticated'
import {ThreadItemPostTombstone} from '#/screens/PostThread/components/ThreadItemPostTombstone'
import {ThreadItemReadMore} from '#/screens/PostThread/components/ThreadItemReadMore'
import {ThreadItemReadMoreUp} from '#/screens/PostThread/components/ThreadItemReadMoreUp'
import {ThreadItemReplyComposerSkeleton} from '#/screens/PostThread/components/ThreadItemReplyComposer'
import {ThreadItemShowOtherReplies} from '#/screens/PostThread/components/ThreadItemShowOtherReplies'
import {
  ThreadItemTreePost,
  ThreadItemTreePostSkeleton,
} from '#/screens/PostThread/components/ThreadItemTreePost'
import {atoms as a, native, platform, useBreakpoints, web} from '#/alf'
import * as Layout from '#/components/Layout'
import {ListFooter} from '#/components/Lists'

const PARENT_CHUNK_SIZE = 5
const CHILDREN_CHUNK_SIZE = 50

export function PostThread({uri}: {uri: string}) {
  const {gtMobile} = useBreakpoints()
  const {hasSession} = useSession()
  const initialNumToRender = useInitialNumToRender()
  const {height: windowHeight} = useWindowDimensions()
  const anchorPostSource = useUnstablePostSource(uri)
  const feedFeedback = useFeedFeedback(
    anchorPostSource?.feedSourceInfo,
    hasSession,
  )

  /*
   * One query to rule them all
   */
  const thread = usePostThread({anchor: uri})
  const {anchor, hasParents} = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    let hasParents = false
    for (const item of thread.data.items) {
      if (item.type === 'threadPost' && item.depth === 0) {
        return {anchor: item, hasParents}
      }
      hasParents = true
    }
    return {hasParents}
  }, [thread.data.items])

  const {openComposer} = useOpenComposer()
  const optimisticOnPostReply = useCallback(
    (payload: OnPostSuccessData) => {
      if (payload) {
        const {replyToUri, posts} = payload
        if (replyToUri && posts.length) {
          thread.actions.insertReplies(replyToUri, posts)
        }
      }
    },
    [thread],
  )
  const onReplyToAnchor = useCallback(() => {
    if (anchor?.type !== 'threadPost') {
      return
    }
    const post = anchor.value.post
    openComposer({
      replyTo: {
        uri: anchor.uri,
        cid: post.cid,
        text: post.record.text,
        author: post.author,
        embed: post.embed,
        moderation: anchor.moderation,
        langs: post.record.langs,
      },
      onPostSuccess: optimisticOnPostReply,
    })

    if (anchorPostSource) {
      feedFeedback.sendInteraction({
        item: post.uri,
        event: 'app.bsky.feed.defs#interactionReply',
        feedContext: anchorPostSource.post.feedContext,
        reqId: anchorPostSource.post.reqId,
      })
    }
  }, [
    anchor,
    openComposer,
    optimisticOnPostReply,
    anchorPostSource,
    feedFeedback,
  ])

  const isRoot = !!anchor && anchor.value.post.record.reply === undefined
  const canReply = !anchor?.value.post?.viewer?.replyDisabled
  const [maxParentCount, setMaxParentCount] = useState(PARENT_CHUNK_SIZE)
  const [maxChildrenCount, setMaxChildrenCount] = useState(CHILDREN_CHUNK_SIZE)
  const totalParentCount = useRef(0) // recomputed below
  const totalChildrenCount = useRef(thread.data.items.length) // recomputed below
  const listRef = useRef<ListMethods>(null)
  const anchorRef = useRef<View | null>(null)
  const headerRef = useRef<View | null>(null)

  /*
   * On a cold load, parents are not prepended until the anchor post has
   * rendered as the first item in the list. This gives us a consistent
   * reference point for which to pin the anchor post to the top of the screen.
   *
   * We simulate a cold load any time the user changes the view or sort params
   * so that this handling is consistent.
   *
   * On native, `maintainVisibleContentPosition={{minIndexForVisible: 0}}` gives
   * us this for free, since the anchor post is the first item in the list.
   *
   * On web, `onContentSizeChange` is used to get ahead of next paint and handle
   * this scrolling.
   */
  const [deferParents, setDeferParents] = useState(true)
  /**
   * Used to flag whether we should scroll to the anchor post. On a cold load,
   * this is always true. And when a user changes thread parameters, we also
   * manually set this to true.
   */
  const shouldHandleScroll = useRef(true)
  /**
   * Called any time the content size of the list changes. Could be a fresh
   * render, items being added to the list, or any resize that changes the
   * scrollable size of the content.
   *
   * We want this to fire every time we change params (which will reset
   * `deferParents` via `onLayout` on the anchor post, due to the key change),
   * or click into a new post (which will result in a fresh `deferParents`
   * hook).
   *
   * The result being: any intentional change in view by the user will result
   * in the anchor being pinned as the first item.
   */
  const onContentSizeChangeWebOnly = web(() => {
    const list = listRef.current
    const anchor = anchorRef.current as any as Element
    const header = headerRef.current as any as Element

    if (list && anchor && header && shouldHandleScroll.current) {
      const anchorOffsetTop = anchor.getBoundingClientRect().top
      const headerHeight = header.getBoundingClientRect().height

      /*
       * `deferParents` is `true` on a cold load, and always reset to
       * `true` when params change via `prepareForParamsUpdate`.
       *
       * On a cold load or a push to a new post, on the first pass of this
       * logic, the anchor post is the first item in the list. Therefore
       * `anchorOffsetTop - headerHeight` will be 0.
       *
       * When a user changes thread params, on the first pass of this logic,
       * the anchor post may not move (if there are no parents above it), or it
       * may have gone off the screen above, because of the sudden lack of
       * parents due to `deferParents === true`. This negative value (minus
       * `headerHeight`) will result in a _negative_ `offset` value, which will
       * scroll the anchor post _down_ to the top of the screen.
       *
       * However, `prepareForParamsUpdate` also resets scroll to `0`, so when a user
       * changes params, the anchor post's offset will actually be equivalent
       * to the `headerHeight` because of how the DOM is stacked on web.
       * Therefore, `anchorOffsetTop - headerHeight` will once again be 0,
       * which means the first pass in this case will result in no scroll.
       *
       * Then, once parents are prepended, this will fire again. Now, the
       * `anchorOffsetTop` will be positive, which minus the header height,
       * will give us a _positive_ offset, which will scroll the anchor post
       * back _up_ to the top of the screen.
       */
      const offset = anchorOffsetTop - headerHeight
      list.scrollToOffset({offset})

      /*
       * After we manage to do a positive adjustment, we need to ensure this
       * doesn't run again until scroll handling is requested again via
       * `shouldHandleScroll.current === true` and a params change via
       * `prepareForParamsUpdate`.
       *
       * The `isRoot` here is needed because if we're looking at the anchor
       * post, this handler will not fire after `deferParents` is set to
       * `false`, since there are no parents to render above it. In this case,
       * we want to make sure `shouldHandleScroll` is set to `false` right away
       * so that subsequent size changes unrelated to a params change (like
       * pagination) do not affect scroll.
       */
      if (offset > 0 || isRoot) shouldHandleScroll.current = false
    }
  })

  /**
   * Ditto the above, but for native.
   */
  const onContentSizeChangeNativeOnly = native(() => {
    const list = listRef.current
    const anchor = anchorRef.current

    if (list && anchor && shouldHandleScroll.current) {
      /*
       * `prepareForParamsUpdate` is called any time the user changes thread params like
       * `view` or `sort`, which sets `deferParents(true)` and resets the
       * scroll to the top of the list. However, there is a split second
       * where the top of the list is wherever the parents _just were_. So if
       * there were parents, the anchor is not at the top of the list just
       * prior to this handler being called.
       *
       * Once this handler is called, the anchor post is the first item in
       * the list (because of `deferParents` being `true`), and so we can
       * synchronously scroll the list back to the top of the list (which is
       * 0 on native, no need to handle `headerHeight`).
       */
      list.scrollToOffset({
        animated: false,
        offset: 0,
      })

      /*
       * After this first pass, `deferParents` will be `false`, and those
       * will render in. However, the anchor post will retain its position
       * because of `maintainVisibleContentPosition` handling on native. So we
       * don't need to let this handler run again, like we do on web.
       */
      shouldHandleScroll.current = false
    }
  })

  /**
   * Called any time the user changes thread params, such as `view` or `sort`.
   * Prepares the UI for repositioning of the scroll so that the anchor post is
   * always at the top after a params change.
   *
   * No need to handle max parents here, deferParents will handle that and we
   * want it to re-render with the same items above the anchor.
   */
  const prepareForParamsUpdate = useCallback(() => {
    /**
     * Truncate list so that anchor post is the first item in the list. Manual
     * scroll handling on web is predicated on this, and on native, this allows
     * `maintainVisibleContentPosition` to do its thing.
     */
    setDeferParents(true)
    // reset this to a lower value for faster re-render
    setMaxChildrenCount(CHILDREN_CHUNK_SIZE)
    // set flag
    shouldHandleScroll.current = true
  }, [setDeferParents, setMaxChildrenCount])

  const setSortWrapped = useCallback(
    (sort: string) => {
      prepareForParamsUpdate()
      thread.actions.setSort(sort)
    },
    [thread, prepareForParamsUpdate],
  )

  const setViewWrapped = useCallback(
    (view: ThreadViewOption) => {
      prepareForParamsUpdate()
      thread.actions.setView(view)
    },
    [thread, prepareForParamsUpdate],
  )

  const onStartReached = () => {
    if (thread.state.isFetching) return
    // can be true after `prepareForParamsUpdate` is called
    if (deferParents) return
    // prevent any state mutations if we know we're done
    if (maxParentCount >= totalParentCount.current) return
    setMaxParentCount(n => n + PARENT_CHUNK_SIZE)
  }

  const onEndReached = () => {
    if (thread.state.isFetching) return
    // can be true after `prepareForParamsUpdate` is called
    if (deferParents) return
    // prevent any state mutations if we know we're done
    if (maxChildrenCount >= totalChildrenCount.current) return
    setMaxChildrenCount(prev => prev + CHILDREN_CHUNK_SIZE)
  }

  const slices = useMemo(() => {
    const results: ThreadItem[] = []

    if (!thread.data.items.length) return results

    /*
     * Pagination hack, tracks the # of items below the anchor post.
     */
    let childrenCount = 0

    for (let i = 0; i < thread.data.items.length; i++) {
      const item = thread.data.items[i]
      /*
       * Need to check `depth`, since not found or blocked posts are not
       * `threadPost`s, but still have `depth`.
       */
      const hasDepth = 'depth' in item

      /*
       * Handle anchor post.
       */
      if (hasDepth && item.depth === 0) {
        results.push(item)

        // Recalculate total parents current index.
        totalParentCount.current = i
        // Recalculate total children using (length - 1) - current index.
        totalChildrenCount.current = thread.data.items.length - 1 - i

        /*
         * Walk up the parents, limiting by `maxParentCount`
         */
        if (!deferParents) {
          const start = i - 1
          if (start >= 0) {
            const limit = Math.max(0, start - maxParentCount)
            for (let pi = start; pi >= limit; pi--) {
              results.unshift(thread.data.items[pi])
            }
          }
        }
      } else {
        // ignore any parent items
        if (item.type === 'readMoreUp' || (hasDepth && item.depth < 0)) continue
        // can exit early if we've reached the max children count
        if (childrenCount > maxChildrenCount) break

        results.push(item)
        childrenCount++
      }
    }

    return results
  }, [thread, deferParents, maxParentCount, maxChildrenCount])

  const isTombstoneView = useMemo(() => {
    if (slices.length > 1) return false
    return slices.every(
      s => s.type === 'threadPostBlocked' || s.type === 'threadPostNotFound',
    )
  }, [slices])

  const renderItem = useCallback(
    ({item, index}: {item: ThreadItem; index: number}) => {
      if (item.type === 'threadPost') {
        if (item.depth < 0) {
          return (
            <ThreadItemPost
              item={item}
              threadgateRecord={thread.data.threadgate?.record ?? undefined}
              overrides={{
                topBorder: index === 0,
              }}
              onPostSuccess={optimisticOnPostReply}
            />
          )
        } else if (item.depth === 0) {
          return (
            /*
             * Keep this view wrapped so that the anchor post is always index 0
             * in the list and `maintainVisibleContentPosition` can do its
             * thing.
             */
            <View collapsable={false}>
              <View
                /*
                 * IMPORTANT: this is a load-bearing key on all platforms. We
                 * want to force `onLayout` to fire any time the thread params
                 * change so that `deferParents` is always reset to `false` once
                 * the anchor post is rendered.
                 *
                 * If we ever add additional thread params to this screen, they
                 * will need to be added here.
                 */
                key={item.uri + thread.state.view + thread.state.sort}
                ref={anchorRef}
                onLayout={() => setDeferParents(false)}
              />
              <ThreadItemAnchor
                item={item}
                threadgateRecord={thread.data.threadgate?.record ?? undefined}
                onPostSuccess={optimisticOnPostReply}
                postSource={anchorPostSource}
              />
            </View>
          )
        } else {
          if (thread.state.view === 'tree') {
            return (
              <ThreadItemTreePost
                item={item}
                threadgateRecord={thread.data.threadgate?.record ?? undefined}
                overrides={{
                  moderation: thread.state.otherItemsVisible && item.depth > 0,
                }}
                onPostSuccess={optimisticOnPostReply}
              />
            )
          } else {
            return (
              <ThreadItemPost
                item={item}
                threadgateRecord={thread.data.threadgate?.record ?? undefined}
                overrides={{
                  moderation: thread.state.otherItemsVisible && item.depth > 0,
                }}
                onPostSuccess={optimisticOnPostReply}
              />
            )
          }
        }
      } else if (item.type === 'threadPostNoUnauthenticated') {
        if (item.depth < 0) {
          return <ThreadItemPostNoUnauthenticated item={item} />
        } else if (item.depth === 0) {
          return <ThreadItemAnchorNoUnauthenticated />
        }
      } else if (item.type === 'readMore') {
        return (
          <ThreadItemReadMore
            item={item}
            view={thread.state.view === 'tree' ? 'tree' : 'linear'}
          />
        )
      } else if (item.type === 'readMoreUp') {
        return <ThreadItemReadMoreUp item={item} />
      } else if (item.type === 'threadPostBlocked') {
        return <ThreadItemPostTombstone type="blocked" />
      } else if (item.type === 'threadPostNotFound') {
        return <ThreadItemPostTombstone type="not-found" />
      } else if (item.type === 'replyComposer') {
        return (
          <View>
            {gtMobile && (
              <ThreadComposePrompt onPressCompose={onReplyToAnchor} />
            )}
          </View>
        )
      } else if (item.type === 'showOtherReplies') {
        return <ThreadItemShowOtherReplies onPress={item.onPress} />
      } else if (item.type === 'skeleton') {
        if (item.item === 'anchor') {
          return <ThreadItemAnchorSkeleton />
        } else if (item.item === 'reply') {
          if (thread.state.view === 'linear') {
            return <ThreadItemPostSkeleton index={index} />
          } else {
            return <ThreadItemTreePostSkeleton index={index} />
          }
        } else if (item.item === 'replyComposer') {
          return <ThreadItemReplyComposerSkeleton />
        }
      }
      return null
    },
    [
      thread,
      optimisticOnPostReply,
      onReplyToAnchor,
      gtMobile,
      anchorPostSource,
    ],
  )

  const defaultListFooterHeight = hasParents ? windowHeight - 200 : undefined

  return (
    <>
      <Layout.Header.Outer headerRef={headerRef}>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans context="description">Post</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot>
          <HeaderDropdown
            sort={thread.state.sort}
            setSort={setSortWrapped}
            view={thread.state.view}
            setView={setViewWrapped}
          />
        </Layout.Header.Slot>
      </Layout.Header.Outer>

      {thread.state.error ? (
        <ThreadError
          error={thread.state.error}
          onRetry={thread.actions.refetch}
        />
      ) : (
        <List
          ref={listRef}
          data={slices}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          onContentSizeChange={platform({
            web: onContentSizeChangeWebOnly,
            default: onContentSizeChangeNativeOnly,
          })}
          onStartReached={onStartReached}
          onEndReached={onEndReached}
          onEndReachedThreshold={4}
          onStartReachedThreshold={1}
          /**
           * NATIVE ONLY
           * {@link https://reactnative.dev/docs/scrollview#maintainvisiblecontentposition}
           */
          maintainVisibleContentPosition={{minIndexForVisible: 0}}
          desktopFixedHeight
          sideBorders={false}
          ListFooterComponent={
            <ListFooter
              /*
               * On native, if `deferParents` is true, we need some extra buffer to
               * account for the `on*ReachedThreshold` values.
               *
               * Otherwise, and on web, this value needs to be the height of
               * the viewport _minus_ a sensible min-post height e.g. 200, so
               * that there's enough scroll remaining to get the anchor post
               * back to the top of the screen when handling scroll.
               */
              height={platform({
                web: defaultListFooterHeight,
                default: deferParents
                  ? windowHeight * 2
                  : defaultListFooterHeight,
              })}
              style={isTombstoneView ? {borderTopWidth: 0} : undefined}
            />
          }
          initialNumToRender={initialNumToRender}
          /**
           * Default: 21
           */
          windowSize={7}
          /**
           * Default: 10
           */
          maxToRenderPerBatch={5}
          /**
           * Default: 50
           */
          updateCellsBatchingPeriod={100}
        />
      )}

      {!gtMobile && canReply && hasSession && (
        <MobileComposePrompt onPressReply={onReplyToAnchor} />
      )}
    </>
  )
}

function MobileComposePrompt({onPressReply}: {onPressReply: () => unknown}) {
  const {footerHeight} = useShellLayout()

  const animatedStyle = useAnimatedStyle(() => {
    return {
      bottom: footerHeight.get(),
    }
  })

  return (
    <Animated.View style={[a.fixed, a.left_0, a.right_0, animatedStyle]}>
      <ThreadComposePrompt onPressCompose={onPressReply} />
    </Animated.View>
  )
}

const keyExtractor = (item: ThreadItem) => {
  return item.key
}
