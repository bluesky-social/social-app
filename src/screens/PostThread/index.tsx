import {useMemo, useRef, useState} from 'react'
import {useWindowDimensions, View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useInitialNumToRender} from '#/lib/hooks/useInitialNumToRender'
import {useOpenComposer} from '#/lib/hooks/useOpenComposer'
import {ScrollProvider} from '#/lib/ScrollContext'
import {cleanError} from '#/lib/strings/errors'
import {isNative} from '#/platform/detection'
import {type ThreadItem, usePostThread} from '#/state/queries/usePostThread'
import {type OnPostSuccessData} from '#/state/shell/composer'
import {PostThreadComposePrompt} from '#/view/com/post-thread/PostThreadComposePrompt'
import {PostThreadShowHiddenReplies} from '#/view/com/post-thread/PostThreadShowHiddenReplies'
import {List, type ListMethods} from '#/view/com/util/List'
import {HeaderDropdown} from '#/screens/PostThread/components/HeaderDropdown'
import {
  ThreadAnchor,
  ThreadAnchorSkeleton,
} from '#/screens/PostThread/components/ThreadAnchor'
import {
  ThreadItemPost,
  ThreadItemPostSkeleton,
} from '#/screens/PostThread/components/ThreadItemPost'
import {ThreadItemPostTombstone} from '#/screens/PostThread/components/ThreadItemPostTombstone'
import {ThreadItemReadMore} from '#/screens/PostThread/components/ThreadItemReadMore'
import {ThreadItemTreePost} from '#/screens/PostThread/components/ThreadItemTreePost'
import {useBreakpoints, web} from '#/alf'
import * as Layout from '#/components/Layout'
import {ListFooter} from '#/components/Lists'

const PARENT_CHUNK_SIZE = 5
const CHILDREN_CHUNK_SIZE = 50

export function Inner({uri}: {uri: string | undefined}) {
  const {gtPhone} = useBreakpoints()
  // const {hasSession, currentAccount} = useSession()
  const initialNumToRender = useInitialNumToRender()
  const {height: windowHeight} = useWindowDimensions()

  /*
   * One query to rule them all
   */
  const thread = usePostThread({anchor: uri})

  const optimisticOnPostReply = (payload: OnPostSuccessData) => {
    if (payload) {
      const {replyToUri, posts} = payload
      if (replyToUri && posts.length) {
        thread.actions.insertReplies(replyToUri, posts)
      }
    }
  }

  const {openComposer} = useOpenComposer()
  const onReplyToAnchor = () => {
    const anchorPost = thread.data.items.find(
      slice => slice.type === 'threadPost' && slice.ui.isAnchor,
    )
    if (anchorPost?.type !== 'threadPost') {
      return
    }
    const post = anchorPost.value.post
    openComposer({
      replyTo: {
        uri: anchorPost.uri,
        cid: post.cid,
        text: post.record.text,
        author: post.author,
        embed: post.embed,
        moderation: anchorPost.moderation,
      },
      onPostSuccess: optimisticOnPostReply,
    })
  }

  const listRef = useRef<ListMethods>(null)
  const headerRef = useRef<View | null>(null)
  const anchorRef = useRef<View | null>(null)
  /**
   * WEB ONLY
   *
   * Needed after clicking into a post. This handler ensures that once the
   * parents load in, the anchor post is still at the top of the screen.
   *
   * When this fires, the `List` is scrolled all the way to the top, so
   * measurements taken from `top` correspond to the top of the screen. This
   * handler scrolls the `List` to the top of the highlighted post after
   * parents are prepended, offset by any fixed elements like the header.
   */
  const hasScrolledToAnchor = useRef(false)
  const onContentSizeChangeWebOnly = web(() => {
    const anchorElement = anchorRef.current as any as Element
    const headerElement = headerRef.current as any as Element
    if (
      anchorElement &&
      headerElement &&
      !deferParents &&
      !hasScrolledToAnchor.current
    ) {
      // distance from top of the list (screen)
      const anchorOffsetTop = anchorElement.getBoundingClientRect().top
      const headerHeight = headerElement.getBoundingClientRect().height
      const scrollPosition = anchorOffsetTop - headerHeight
      /*
       * If scroll position is negative, it means the anchor post is above the
       * top of the screen, meaning the user scrolled the list. In that case,
       * we want to restore the previous scroll position by not scrolling here
       * at all.
       */
      if (scrollPosition >= headerHeight) {
        listRef.current?.scrollToOffset({
          animated: false,
          offset: scrollPosition,
        })
        hasScrolledToAnchor.current = true
      }
    }
  })

  /*
   * On native, any time we navigate to a new post/reply (even if the data is
   * cached), we skip rendering parents so that the anchor post is the first
   * item in the list. That way,
   * `maintainVisibleContentPosition={{minIndexForVisible: 0}}` will pin the
   * anchor post to the top of the screen, and on the next render, we'll
   * include parents.
   *
   * On the web this is not necessary because we can synchronously adjust the
   * scroll in onContentSizeChange instead.
   */
  const [deferParents, setDeferParents] = useState(isNative)
  const [maxParentCount, setMaxParentCount] = useState(PARENT_CHUNK_SIZE)
  const [maxChildrenCount, setMaxChildrenCount] = useState(CHILDREN_CHUNK_SIZE)
  const totalParentCount = useRef(0) // recomputed below
  const totalChildrenCount = useRef(thread.data.items.length) // recomputed below

  const onStartReached = () => {
    if (thread.state.isFetching) return
    // prevent any state mutations if we know we're done
    if (maxParentCount >= totalParentCount.current) return
    setMaxParentCount(n => n + PARENT_CHUNK_SIZE)
  }

  const onEndReached = () => {
    if (thread.state.isFetching) return
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
        // ignore parents
        if (hasDepth && item.depth < 0) continue
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

  const renderItem = ({item, index}: {item: ThreadItem; index: number}) => {
    if (item.type === 'threadPost') {
      if (item.depth < 0) {
        if (deferParents) return null
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
          <View
            ref={item.ui.isAnchor ? anchorRef : undefined}
            onLayout={deferParents ? () => setDeferParents(false) : undefined}>
            <ThreadAnchor
              item={item}
              threadgateRecord={thread.data.threadgate?.record ?? undefined}
              onPostSuccess={optimisticOnPostReply}
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
                moderation:
                  thread.state.hiddenThreadItemsVisible && item.depth > 0,
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
                moderation:
                  thread.state.hiddenThreadItemsVisible && item.depth > 0,
              }}
              onPostSuccess={optimisticOnPostReply}
            />
          )
        }
      }
    } else if (item.type === 'readMore') {
      return (
        <ThreadItemReadMore
          item={item}
          view={thread.state.view === 'tree' ? 'tree' : 'linear'}
        />
      )
    } else if (item.type === 'threadPostBlocked') {
      return <ThreadItemPostTombstone type="blocked" />
    } else if (item.type === 'threadPostNotFound') {
      return <ThreadItemPostTombstone type="not-found" />
    } else if (item.type === 'replyComposer') {
      return (
        <View>
          {gtPhone && (
            <PostThreadComposePrompt onPressCompose={onReplyToAnchor} />
          )}
        </View>
      )
    } else if (item.type === 'showHiddenReplies') {
      return (
        <PostThreadShowHiddenReplies
          type="hidden"
          onPress={() => {
            item.onPress()
            /*
             * Bit of a hack. This resets the ref value for the anchor so that
             * the next time `onContentSizeChangeWebOnly` fires, it won't
             * adjust scroll. However, on the next render cycle, it will, which
             * will give us time to insert the skeleton state and handle scroll.
             */
            anchorRef.current = null
          }}
        />
      )
    } else if (item.type === 'skeleton') {
      if (item.item === 'anchor') {
        return <ThreadAnchorSkeleton />
      } else if (item.item === 'reply') {
        return <ThreadItemPostSkeleton />
      }
    }
    return null
  }

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
            setSort={thread.actions.setSort}
            view={thread.state.view}
            setView={thread.actions.setView}
          />
        </Layout.Header.Slot>
      </Layout.Header.Outer>

      {thread.state.error ? (
        <PostThreadError error={thread.state.error} />
      ) : (
        <ScrollProvider
        // TODO do we need?
        //onMomentumEnd={onMomentumEnd}
        >
          <List
            ref={listRef}
            data={slices}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            onContentSizeChange={onContentSizeChangeWebOnly}
            onStartReached={onStartReached}
            onEndReached={onEndReached}
            onEndReachedThreshold={2}
            onStartReachedThreshold={1}
            /**
             * @see https://reactnative.dev/docs/scrollview#maintainvisiblecontentposition
             */
            maintainVisibleContentPosition={
              isNative ? {minIndexForVisible: 0} : undefined
            }
            desktopFixedHeight
            // removeClippedSubviews={isAndroid ? false : undefined}
            ListFooterComponent={
              <ListFooter
                /*
                 * Using `isFetching` over `isFetchingNextPage` is done on
                 * purpose here so we get the loader on initial render
                 */
                // isFetchingNextPage={isFetching}
                error={cleanError(thread.state.error)}
                onRetry={thread.actions.refetch}
                /*
                 * 200 is based on the minimum height of a post. This is enough
                 * extra height for the `maintainVisPos` to work without
                 * causing weird jumps on web or glitches on native
                 */
                height={windowHeight - 200}
                style={isTombstoneView ? {borderTopWidth: 0} : undefined}
              />
            }
            initialNumToRender={initialNumToRender}
            windowSize={11}
            sideBorders={false}
          />
        </ScrollProvider>
      )}
    </>
  )
}

function PostThreadError({error}: {error: Error}) {
  const {_} = useLingui()

  // TODO use new cleanError hook
  const {title: _title, message: _message} = useMemo(() => {
    let title = _(msg`An error occurred`)
    let message = cleanError(error)

    if (error.message.startsWith('Post not found')) {
      title = _(msg`Post not found`)
      message = _(msg`The post may have been deleted.`)
    }
    return {title, message}
  }, [_, error])

  return <View />
}

const keyExtractor = (item: ThreadItem) => {
  return item.key
}
