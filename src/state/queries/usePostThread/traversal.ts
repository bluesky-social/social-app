/* eslint-disable no-labels */
import {AppBskyUnspeccedDefs, type ModerationOpts} from '@atproto/api'

import {
  type ApiThreadItem,
  type PostThreadParams,
  type ThreadItem,
  type TraversalMetadata,
} from '#/state/queries/usePostThread/types'
import {
  getPostRecord,
  getThreadPostNoUnauthenticatedUI,
  getThreadPostUI,
  getTraversalMetadata,
  storeTraversalMetadata,
} from '#/state/queries/usePostThread/utils'
import * as views from '#/state/queries/usePostThread/views'

export function sortAndAnnotateThreadItems(
  thread: ApiThreadItem[],
  {
    threadgateHiddenReplies,
    moderationOpts,
    view,
    skipModerationHandling,
  }: {
    threadgateHiddenReplies: Set<string>
    moderationOpts: ModerationOpts
    view: PostThreadParams['view']
    /**
     * Set to `true` in cases where we already know the moderation state of the
     * post e.g. when fetching additional replies from the server. This will
     * prevent additional sorting or nested-branch truncation, and all replies,
     * regardless of moderation state, will be included in the resulting
     * `threadItems` array.
     */
    skipModerationHandling?: boolean
  },
) {
  const threadItems: ThreadItem[] = []
  const otherThreadItems: ThreadItem[] = []
  const metadatas = new Map<string, TraversalMetadata>()

  traversal: for (let i = 0; i < thread.length; i++) {
    const item = thread[i]
    let parentMetadata: TraversalMetadata | undefined
    let metadata: TraversalMetadata | undefined

    if (AppBskyUnspeccedDefs.isThreadItemPost(item.value)) {
      parentMetadata = metadatas.get(
        getPostRecord(item.value.post).reply?.parent?.uri || '',
      )
      metadata = getTraversalMetadata({
        item,
        parentMetadata,
        prevItem: thread.at(i - 1),
        nextItem: thread.at(i + 1),
      })
      storeTraversalMetadata(metadatas, metadata)
    }

    if (item.depth < 0) {
      /*
       * Parents are ignored until we find the anchor post, then we walk
       * _up_ from there.
       */
    } else if (item.depth === 0) {
      if (AppBskyUnspeccedDefs.isThreadItemNoUnauthenticated(item.value)) {
        threadItems.push(views.threadPostNoUnauthenticated(item))
      } else if (AppBskyUnspeccedDefs.isThreadItemNotFound(item.value)) {
        threadItems.push(views.threadPostNotFound(item))
      } else if (AppBskyUnspeccedDefs.isThreadItemBlocked(item.value)) {
        threadItems.push(views.threadPostBlocked(item))
      } else if (AppBskyUnspeccedDefs.isThreadItemPost(item.value)) {
        const post = views.threadPost({
          uri: item.uri,
          depth: item.depth,
          value: item.value,
          moderationOpts,
          threadgateHiddenReplies,
        })
        threadItems.push(post)

        parentTraversal: for (let pi = i - 1; pi >= 0; pi--) {
          const parent = thread[pi]

          if (
            AppBskyUnspeccedDefs.isThreadItemNoUnauthenticated(parent.value)
          ) {
            const post = views.threadPostNoUnauthenticated(parent)
            post.ui = getThreadPostNoUnauthenticatedUI({
              depth: parent.depth,
              // ignore for now
              // prevItemDepth: thread[pi - 1]?.depth,
              nextItemDepth: thread[pi + 1]?.depth,
            })
            threadItems.unshift(post)
            // for now, break parent traversal at first no-unauthed
            break parentTraversal
          } else if (AppBskyUnspeccedDefs.isThreadItemNotFound(parent.value)) {
            threadItems.unshift(views.threadPostNotFound(parent))
            break parentTraversal
          } else if (AppBskyUnspeccedDefs.isThreadItemBlocked(parent.value)) {
            threadItems.unshift(views.threadPostBlocked(parent))
            break parentTraversal
          } else if (AppBskyUnspeccedDefs.isThreadItemPost(parent.value)) {
            threadItems.unshift(
              views.threadPost({
                uri: parent.uri,
                depth: parent.depth,
                value: parent.value,
                moderationOpts,
                threadgateHiddenReplies,
              }),
            )
          }
        }
      }
    } else if (item.depth > 0) {
      /*
       * The API does not send down any unavailable replies, so this will
       * always be false (for now). If we ever wanted to tombstone them here,
       * we could.
       */
      const shouldBreak =
        AppBskyUnspeccedDefs.isThreadItemNoUnauthenticated(item.value) ||
        AppBskyUnspeccedDefs.isThreadItemNotFound(item.value) ||
        AppBskyUnspeccedDefs.isThreadItemBlocked(item.value)

      if (shouldBreak) {
        const branch = getBranch(thread, i, item.depth)
        // could insert tombstone
        i = branch.end
        continue traversal
      } else if (AppBskyUnspeccedDefs.isThreadItemPost(item.value)) {
        if (parentMetadata) {
          /*
           * Set this value before incrementing the parent's repliesSeenCounter
           */
          metadata!.replyIndex = parentMetadata.repliesIndexCounter
          // Increment the parent's repliesIndexCounter
          parentMetadata.repliesIndexCounter += 1
        }

        const post = views.threadPost({
          uri: item.uri,
          depth: item.depth,
          value: item.value,
          moderationOpts,
          threadgateHiddenReplies,
        })

        if (!post.isBlurred || skipModerationHandling) {
          /*
           * Not moderated, need to insert it
           */
          threadItems.push(post)

          /*
           * Update seen reply count of parent
           */
          if (parentMetadata) {
            parentMetadata.repliesSeenCounter += 1
          }
        } else {
          /*
           * Moderated in some way, we're going to walk children
           */
          const parent = post
          const parentIsTopLevelReply = parent.depth === 1
          // get sub tree
          const branch = getBranch(thread, i, item.depth)

          if (parentIsTopLevelReply) {
            // push branch anchor into sorted array
            otherThreadItems.push(parent)
            // skip branch anchor in branch traversal
            const startIndex = branch.start + 1

            for (let ci = startIndex; ci <= branch.end; ci++) {
              const child = thread[ci]

              if (AppBskyUnspeccedDefs.isThreadItemPost(child.value)) {
                const childParentMetadata = metadatas.get(
                  getPostRecord(child.value.post).reply?.parent?.uri || '',
                )
                const childMetadata = getTraversalMetadata({
                  item: child,
                  prevItem: thread[ci - 1],
                  nextItem: thread[ci + 1],
                  parentMetadata: childParentMetadata,
                })
                storeTraversalMetadata(metadatas, childMetadata)
                if (childParentMetadata) {
                  /*
                   * Set this value before incrementing the parent's repliesIndexCounter
                   */
                  childMetadata!.replyIndex =
                    childParentMetadata.repliesIndexCounter
                  childParentMetadata.repliesIndexCounter += 1
                }

                const childPost = views.threadPost({
                  uri: child.uri,
                  depth: child.depth,
                  value: child.value,
                  moderationOpts,
                  threadgateHiddenReplies,
                })

                /*
                 * If a child is moderated in any way, drop it an its sub-branch
                 * entirely. To reveal these, the user must navigate to the
                 * parent post directly.
                 */
                if (childPost.isBlurred) {
                  ci = getBranch(thread, ci, child.depth).end
                } else {
                  otherThreadItems.push(childPost)

                  if (childParentMetadata) {
                    childParentMetadata.repliesSeenCounter += 1
                  }
                }
              } else {
                /*
                 * Drop the rest of the branch if we hit anything unexpected
                 */
                break
              }
            }
          }

          /*
           * Skip to next branch
           */
          i = branch.end
          continue traversal
        }
      }
    }
  }

  /*
   * Both `threadItems` and `otherThreadItems` now need to be traversed again to fully compute
   * UI state based on collected metadata. These arrays will be muted in situ.
   */
  for (const subset of [threadItems, otherThreadItems]) {
    for (let i = 0; i < subset.length; i++) {
      const item = subset[i]
      const prevItem = subset.at(i - 1)
      const nextItem = subset.at(i + 1)

      if (item.type === 'threadPost') {
        const metadata = metadatas.get(item.uri)

        if (metadata) {
          if (metadata.parentMetadata) {
            /*
             * Track what's before/after now that we've applied moderation
             */
            if (prevItem?.type === 'threadPost')
              metadata.prevItemDepth = prevItem?.depth
            if (nextItem?.type === 'threadPost')
              metadata.nextItemDepth = nextItem?.depth

            /*
             * Item is the last "sibling" if we know for sure we're out of
             * replies on the parent (even though this item itself may have its
             * own reply branches).
             */
            const isLastSiblingByCounts =
              metadata.replyIndex ===
              metadata.parentMetadata.repliesIndexCounter - 1

            /*
             * Item can also be the last "sibling" if we know we don't have a
             * next item, OR if that next item's depth is less than this item's
             * depth (meaning it's a sibling of the parent, not a child of this
             * item).
             */
            const isImplicitlyLastSibling =
              metadata.nextItemDepth === undefined ||
              metadata.nextItemDepth < metadata.depth

            /*
             * Ok now we can set the last sibling state.
             */
            metadata.isLastSibling =
              isLastSiblingByCounts || isImplicitlyLastSibling

            /*
             * Item is the last "child" in a branch if there is no next item,
             * or if the next item's depth is less than this item's depth (a
             * sibling of the parent) or equal to this item's depth (a sibling
             * of this item)
             */
            metadata.isLastChild =
              metadata.nextItemDepth === undefined ||
              metadata.nextItemDepth <= metadata.depth

            /*
             * If this is the last sibling, it's implicitly part of the last
             * branch of this sub-tree.
             */
            if (metadata.isLastSibling) {
              metadata.isPartOfLastBranchFromDepth = metadata.depth

              /**
               * If the parent is part of the last branch of the sub-tree, so is the child.
               */
              if (metadata.parentMetadata.isPartOfLastBranchFromDepth) {
                metadata.isPartOfLastBranchFromDepth =
                  metadata.parentMetadata.isPartOfLastBranchFromDepth
              }
            }

            /*
             * If this is the last sibling, and the parent has unhydrated replies,
             * at some point down the line we will need to show a "read more".
             */
            if (
              metadata.parentMetadata.repliesUnhydrated > 0 &&
              metadata.isLastSibling
            ) {
              metadata.upcomingParentReadMore = metadata.parentMetadata
            }

            /*
             * Copy in the parent's upcoming read more, if it exists. Once we
             * reach the bottom, we'll insert a "read more"
             */
            if (metadata.parentMetadata.upcomingParentReadMore) {
              metadata.upcomingParentReadMore =
                metadata.parentMetadata.upcomingParentReadMore
            }

            /*
             * Copy in the parent's skipped indents
             */
            metadata.skippedIndentIndices = new Set([
              ...metadata.parentMetadata.skippedIndentIndices,
            ])

            /**
             * If this is the last sibling, and the parent has no unhydrated
             * replies, then we know we can skip an indent line.
             */
            if (
              metadata.parentMetadata.repliesUnhydrated <= 0 &&
              metadata.isLastSibling
            ) {
              /**
               * Depth is 2 more than the 0-index of the indent calculation
               * bc of how we render these. So instead of handling that in the
               * component, we just adjust that back to 0-index here.
               */
              metadata.skippedIndentIndices.add(item.depth - 2)
            }
          }

          /*
           * If this post has unhydrated replies, and it is the last child, then
           * it itself needs a "read more"
           */
          if (metadata.repliesUnhydrated > 0 && metadata.isLastChild) {
            metadata.precedesChildReadMore = true
            subset.splice(i + 1, 0, views.readMore(metadata))
            i++ // skip next iteration
          }

          /*
           * Tree-view only.
           *
           * If there's an upcoming parent read more, this branch is part of the
           * last branch of the sub-tree, and the item itself is the last child,
           * insert the parent "read more".
           */
          if (
            view === 'tree' &&
            metadata.upcomingParentReadMore &&
            metadata.isPartOfLastBranchFromDepth ===
              metadata.upcomingParentReadMore.depth &&
            metadata.isLastChild
          ) {
            subset.splice(
              i + 1,
              0,
              views.readMore(metadata.upcomingParentReadMore),
            )
            i++
          }

          /**
           * Only occurs for the first item in the thread, which may have
           * additional parents not included in this request.
           */
          if (item.value.moreParents) {
            metadata.followsReadMoreUp = true
            subset.splice(i, 0, views.readMoreUp(metadata))
            i++
          }

          /*
           * Calculate the final UI state for the thread item.
           */
          item.ui = getThreadPostUI(metadata)
        }
      }
    }
  }

  return {
    threadItems,
    otherThreadItems,
  }
}

export function buildThread({
  threadItems,
  otherThreadItems,
  serverOtherThreadItems,
  isLoading,
  hasSession,
  otherItemsVisible,
  hasOtherThreadItems,
  showOtherItems,
}: {
  threadItems: ThreadItem[]
  otherThreadItems: ThreadItem[]
  serverOtherThreadItems: ThreadItem[]
  isLoading: boolean
  hasSession: boolean
  otherItemsVisible: boolean
  hasOtherThreadItems: boolean
  showOtherItems: () => void
}) {
  /**
   * `threadItems` is memoized here, so don't mutate it directly.
   */
  const items = [...threadItems]

  if (isLoading) {
    const anchorPost = items.at(0)
    const hasAnchorFromCache = anchorPost && anchorPost.type === 'threadPost'
    const skeletonReplies = hasAnchorFromCache
      ? (anchorPost.value.post.replyCount ?? 4)
      : 4

    if (!items.length) {
      items.push(
        views.skeleton({
          key: 'anchor-skeleton',
          item: 'anchor',
        }),
      )
    }

    if (hasSession) {
      // we might have this from cache
      const replyDisabled =
        hasAnchorFromCache &&
        anchorPost.value.post.viewer?.replyDisabled === true

      if (hasAnchorFromCache) {
        if (!replyDisabled) {
          items.push({
            type: 'replyComposer',
            key: 'replyComposer',
          })
        }
      } else {
        items.push(
          views.skeleton({
            key: 'replyComposer',
            item: 'replyComposer',
          }),
        )
      }
    }

    for (let i = 0; i < skeletonReplies; i++) {
      items.push(
        views.skeleton({
          key: `anchor-skeleton-reply-${i}`,
          item: 'reply',
        }),
      )
    }
  } else {
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (
        item.type === 'threadPost' &&
        item.depth === 0 &&
        !item.value.post.viewer?.replyDisabled &&
        hasSession
      ) {
        items.splice(i + 1, 0, {
          type: 'replyComposer',
          key: 'replyComposer',
        })
        break
      }
    }

    if (otherThreadItems.length || hasOtherThreadItems) {
      if (otherItemsVisible) {
        items.push(...otherThreadItems)
        items.push(...serverOtherThreadItems)
      } else {
        items.push({
          type: 'showOtherReplies',
          key: 'showOtherReplies',
          onPress: showOtherItems,
        })
      }
    }
  }

  return items
}

/**
 * Get the start and end index of a "branch" of the thread. A "branch" is a
 * parent and it's children (not siblings). Returned indices are inclusive of
 * the parent and its last child.
 *
 *   items[]               (index, depth)
 *     └─┬ anchor ──────── (0, 0)
 *       ├─── branch ───── (1, 1)
 *       ├──┬ branch ───── (2, 1) (start)
 *       │  ├──┬ leaf ──── (3, 2)
 *       │  │  └── leaf ── (4, 3)
 *       │  └─── leaf ──── (5, 2) (end)
 *       ├─── branch ───── (6, 1)
 *       └─── branch ───── (7, 1)
 *
 *   const { start: 2, end: 5, length: 3 } = getBranch(items, 2, 1)
 */
export function getBranch(
  thread: ApiThreadItem[],
  branchStartIndex: number,
  branchStartDepth: number,
) {
  let end = branchStartIndex

  for (let ci = branchStartIndex + 1; ci < thread.length; ci++) {
    const next = thread[ci]
    if (next.depth > branchStartDepth) {
      end = ci
    } else {
      end = ci - 1
      break
    }
  }

  return {
    start: branchStartIndex,
    end,
    length: end - branchStartIndex,
  }
}
