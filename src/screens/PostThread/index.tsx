import {useMemo, useRef, useState} from 'react'
import {useWindowDimensions, View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useInitialNumToRender} from '#/lib/hooks/useInitialNumToRender'
import {useOpenComposer} from '#/lib/hooks/useOpenComposer'
import {ScrollProvider} from '#/lib/ScrollContext'
import {cleanError} from '#/lib/strings/errors'
import {isNative} from '#/platform/detection'
import {useThreadPreferences} from '#/state/queries/preferences/useThreadPreferences'
import {
  HiddenReplyKind,
  type ThreadItem,
  usePostThread,
} from '#/state/queries/usePostThread'
import {type OnPostSuccessData} from '#/state/shell/composer'
import {PostThreadComposePrompt} from '#/view/com/post-thread/PostThreadComposePrompt'
import {PostThreadShowHiddenReplies} from '#/view/com/post-thread/PostThreadShowHiddenReplies'
import {List, type ListMethods} from '#/view/com/util/List'
import {HeaderDropdown} from '#/screens/PostThread/components/HeaderDropdown'
import {ReadMore} from '#/screens/PostThread/components/ReadMore'
import {
  ThreadAnchor,
  ThreadAnchorSkeleton,
} from '#/screens/PostThread/components/ThreadAnchor'
import {
  ThreadPost,
  ThreadPostSkeleton,
} from '#/screens/PostThread/components/ThreadPost'
import {ThreadReply} from '#/screens/PostThread/components/ThreadReply'
import {atoms as a, useBreakpoints, useTheme, web} from '#/alf'
import * as Layout from '#/components/Layout'
import {ListFooter} from '#/components/Lists'
import {Text} from '#/components/Typography'

const PARENT_CHUNK_SIZE = 5
const REPLIES_CHUNK_SIZE = 50

export function Inner({uri}: {uri: string | undefined}) {
  const t = useTheme()
  const {gtPhone} = useBreakpoints()
  // const {hasSession, currentAccount} = useSession()
  const initialNumToRender = useInitialNumToRender()
  const {height: windowHeight} = useWindowDimensions()

  const {
    isLoaded: isThreadPreferencesLoaded,
    sortReplies,
    setSortReplies,
    prioritizeFollowedUsers,
    treeViewEnabled,
    setTreeViewEnabled,
  } = useThreadPreferences()

  const [shownHiddenReplyKinds, setShownHiddenReplyKinds] = useState<
    Set<HiddenReplyKind>
  >(new Set())

  const {isFetching, error, data, refetch, insertReplies} = usePostThread({
    enabled: isThreadPreferencesLoaded,
    params: {
      anchor: uri,
      sort: sortReplies,
      view: treeViewEnabled ? 'tree' : 'linear',
      prioritizeFollowedUsers,
    },
    state: {
      shownHiddenReplyKinds,
    },
  })

  const optimisticOnPostReply = (data: OnPostSuccessData) => {
    if (data) {
      const {replyToUri, posts} = data
      if (replyToUri && posts.length) {
        insertReplies(replyToUri, posts)
      }
    }
  }

  const {openComposer} = useOpenComposer()
  const onReplyToAnchor = () => {
    const anchorPost = data?.items.find(
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
   * Fires any time the content of the list changes. If user switches back to a
   * sort that was rendered previously, this does NOT fire. Therefore, scroll
   * is only reset to the anchor on initial render, or fresh data.
   *
   * When this fires, the `List` is scrolled all the way to the top, so
   * measurements taken from `top` correspond to the top of the screen. This
   * handler scrolls the `List` to the top of the highlighted post, minus any
   * fixed elements.
   */
  const onContentSizeChangeWebOnly = web(() => {
    const anchorElement = anchorRef.current as any as Element
    const headerElement = headerRef.current as any as Element
    if (anchorElement && headerElement) {
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
      if (scrollPosition >= 0) {
        listRef.current?.scrollToOffset({
          animated: false,
          offset: scrollPosition,
        })
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
  const [maxRepliesCount, setMaxRepliesCount] = useState(REPLIES_CHUNK_SIZE)
  const hasExhaustedReplies = useRef(false)

  const onStartReached = () => {
    // limit to 100
    setMaxParentCount(n => Math.min(100, n + PARENT_CHUNK_SIZE))
  }

  const onEndReached = () => {
    if (isFetching) return
    // prevent any state mutations if we know we're done
    if (hasExhaustedReplies.current) return
    setMaxRepliesCount(prev => prev + REPLIES_CHUNK_SIZE)
  }

  const items = useMemo(() => {
    const results: ThreadItem[] = []

    if (!data?.items) return results

    let repliesCount = 0
    let totalRepliesCount = 0

    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i]

      if ('depth' in item) {
        if (item.depth === 0) {
          results.push(item)

          if (!deferParents) {
            const start = i - 1
            const limit = Math.max(0, start - maxParentCount)
            for (let pi = start; pi >= limit; pi--) {
              results.unshift(data.items[pi])
            }
          }
        } else if (item.depth > 0) {
          totalRepliesCount++

          if (repliesCount <= maxRepliesCount) {
            results.push(item)
            repliesCount++
          }
        }
      } else {
        results.push(item)
      }
    }

    if (totalRepliesCount < maxRepliesCount) {
      hasExhaustedReplies.current = true
    }

    return results
  }, [data, deferParents, maxParentCount, maxRepliesCount])

  const renderItem = ({item, index}: {item: ThreadItem; index: number}) => {
    if (item.type === 'threadPost') {
      if (item.depth < 0) {
        if (deferParents) return null
        return (
          <ThreadPost
            item={item}
            threadgateRecord={data?.threadgate?.record ?? undefined}
            overrides={{
              topBorder: index === 0, // && !item.isParentLoading, // TODO
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
              threadgateRecord={data?.threadgate?.record ?? undefined}
              onPostSuccess={optimisticOnPostReply}
            />
          </View>
        )
      } else {
        if (treeViewEnabled) {
          return (
            <ThreadReply
              item={item}
              threadgateRecord={data?.threadgate?.record ?? undefined}
              overrides={{
                moderation:
                  shownHiddenReplyKinds.has(HiddenReplyKind.Hidden) &&
                  item.depth > 0,
              }}
              onPostSuccess={optimisticOnPostReply}
            />
          )
        } else {
          return (
            <ThreadPost
              item={item}
              threadgateRecord={data?.threadgate?.record ?? undefined}
              overrides={{
                moderation:
                  shownHiddenReplyKinds.has(HiddenReplyKind.Muted) &&
                  item.depth > 0,
              }}
              onPostSuccess={optimisticOnPostReply}
            />
          )
        }
      }
    } else if (item.type === 'readMore') {
      return <ReadMore item={item} view={treeViewEnabled ? 'tree' : 'linear'} />
    } else if (item.type === 'threadPostBlocked') {
      return (
        <View
          style={[
            a.p_lg,
            index !== 0 && a.border_t,
            t.atoms.border_contrast_low,
            t.atoms.bg_contrast_25,
          ]}>
          <Text style={[a.font_bold, a.text_md, t.atoms.text_contrast_medium]}>
            <Trans>Blocked post.</Trans>
          </Text>
        </View>
      )
    } else if (item.type === 'threadPostNotFound') {
      return (
        <View
          style={[
            a.p_lg,
            index !== 0 && a.border_t,
            t.atoms.border_contrast_low,
            t.atoms.bg_contrast_25,
          ]}>
          <Text style={[a.font_bold, a.text_md, t.atoms.text_contrast_medium]}>
            <Trans>Deleted post.</Trans>
          </Text>
        </View>
      )
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
          type={item.kind === 'muted' ? 'muted' : 'hidden'}
          onPress={() =>
            setShownHiddenReplyKinds(kinds => new Set([...kinds, item.kind]))
          }
        />
      )
    } else if (item.type === 'skeleton') {
      if (item.item === 'anchor') {
        return <ThreadAnchorSkeleton />
      } else if (item.item === 'reply') {
        return <ThreadPostSkeleton />
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
            sortReplies={sortReplies}
            treeViewEnabled={treeViewEnabled}
            setSortReplies={setSortReplies}
            setTreeViewEnabled={setTreeViewEnabled}
          />
        </Layout.Header.Slot>
      </Layout.Header.Outer>

      {error ? (
        <PostThreadError error={error} />
      ) : (
        <ScrollProvider
        //onMomentumEnd={onMomentumEnd}
        >
          <List
            ref={listRef}
            data={items}
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
                error={cleanError(error)}
                onRetry={refetch}
                /*
                 * 200 is based on the minimum height of a post. This is enough
                 * extra height for the `maintainVisPos` to work without
                 * causing weird jumps on web or glitches on native
                 */
                height={windowHeight - 200}
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
