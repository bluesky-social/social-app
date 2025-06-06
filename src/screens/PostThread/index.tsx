import {useMemo, useRef, useState} from 'react'
import {useWindowDimensions, View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useInitialNumToRender} from '#/lib/hooks/useInitialNumToRender'
import {useOpenComposer} from '#/lib/hooks/useOpenComposer'
import {ScrollProvider} from '#/lib/ScrollContext'
import {cleanError} from '#/lib/strings/errors'
import {type ThreadItem, usePostThread} from '#/state/queries/usePostThread'
import {type OnPostSuccessData} from '#/state/shell/composer'
import {PostThreadComposePrompt} from '#/view/com/post-thread/PostThreadComposePrompt'
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
import {ThreadItemReadMoreUp} from '#/screens/PostThread/components/ThreadItemReadMoreUp'
import {ThreadItemReplyComposerSkeleton} from '#/screens/PostThread/components/ThreadItemReplyComposer'
import {ThreadItemShowOtherReplies} from '#/screens/PostThread/components/ThreadItemShowOtherReplies'
import {
  ThreadItemTreePost,
  ThreadItemTreePostSkeleton,
} from '#/screens/PostThread/components/ThreadItemTreePost'
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

  const [maxParentCount, setMaxParentCount] = useState(PARENT_CHUNK_SIZE)
  const [maxChildrenCount, setMaxChildrenCount] = useState(CHILDREN_CHUNK_SIZE)
  const totalParentCount = useRef(0) // recomputed below
  const totalChildrenCount = useRef(thread.data.items.length) // recomputed below
  const listRef = useRef<ListMethods>(null)
  const headerRef = useRef<View | null>(null)
  const anchorRef = useRef<View | null>(null)

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
  const shouldScrollToAnchor = useRef(true)
  /**
   * WEB ONLY
   *
   * Called any time the content size of the list changes, just before paint.
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
    const anchorElement = anchorRef.current as any as Element
    const headerElement = headerRef.current as any as Element

    if (anchorElement && headerElement) {
      const anchorOffsetTop = anchorElement.getBoundingClientRect().top
      const headerHeight = headerElement.getBoundingClientRect().height

      if (shouldScrollToAnchor.current) {
        /*
         * `deferParents` is `true` on a cold load, and always reset to
         * `true` when params change (via the key on the anchor post).
         *
         * On a cold load, on the first pass of this logic, the anchor post is
         * the first item in the list. Therefore `anchorOffsetTop - headerHeight`
         * will be 0.
         *
         * On a warm load, on the first pass of this logic, the anchor post may
         * not move (if there are no parents above it), or it may have gone off
         * the screen above, because of the sudden lack of parents due to
         * `deferParents === true`. This negative value (minus `headerHeight`)
         * will result in a _negative_ `offset` value, which will scroll the
         * anchor post _down_ to the top of the screen.
         *
         * Once parents are prepended, this will fire again. Now, the
         * `anchorOffsetTop` will be positive, which minus the header height,
         * will give us a _positive_ offset, which will scroll the anchor post
         * back _up_ to the top of the screen.
         */
        listRef.current?.scrollToOffset({
          offset: anchorOffsetTop - headerHeight,
        })

        /*
         * After the second pass, `deferParents` will be `false`, and we need
         * to ensure this doesn't run again until scroll handling is requested
         * again via `shouldScrollToAnchor.current === true` and a params
         * change.
         */
        if (!deferParents) shouldScrollToAnchor.current = false
      }
    }
  })

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
            /*
             * IMPORTANT: this is a load-bearing key. We want to force
             * `onLayout` to fire any time the thread params change so that
             * `deferParents` is always reset to `false` once the anchor post is
             * rendered.
             *
             * If we ever add additional thread params to this screen, they
             * will need to be added here.
             */
            key={item.uri + thread.state.view + thread.state.sort}
            ref={anchorRef}
            onLayout={() => setDeferParents(false)}>
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
          {gtPhone && (
            <PostThreadComposePrompt onPressCompose={onReplyToAnchor} />
          )}
        </View>
      )
    } else if (item.type === 'showOtherReplies') {
      return <ThreadItemShowOtherReplies onPress={item.onPress} />
    } else if (item.type === 'skeleton') {
      if (item.item === 'anchor') {
        return <ThreadAnchorSkeleton />
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
            setSort={val => {
              thread.actions.setSort(val)
              setDeferParents(true)
              shouldScrollToAnchor.current = true
            }}
            view={thread.state.view}
            setView={val => {
              thread.actions.setView(val)
              setDeferParents(true)
              shouldScrollToAnchor.current = true
            }}
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
             * NATIVE ONLY
             * {@link https://reactnative.dev/docs/scrollview#maintainvisiblecontentposition}
             */
            maintainVisibleContentPosition={{minIndexForVisible: 0}}
            desktopFixedHeight
            // removeClippedSubviews={isAndroid ? false : undefined}
            ListFooterComponent={
              <ListFooter
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
