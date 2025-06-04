import {
  AppBskyUnspeccedDefs,
  type ModerationDecision,
  type ModerationOpts,
} from '@atproto/api'

import {
  type ApiThreadItem,
  type PostThreadParams,
  type ThreadItem,
  type TraversalMetadata,
} from '#/state/queries/usePostThread/types'
import {
  getPostRecord,
  getThreadPostUI,
  getTraversalMetadata,
  storeTraversalMetadata,
} from '#/state/queries/usePostThread/utils'
import * as views from '#/state/queries/usePostThread/views'

export function traverse(
  thread: ApiThreadItem[],
  {
    threadgateHiddenReplies,
    moderationOpts,
    hasSession,
    view,
    hasServerHiddenReplies,
    hiddenRepliesVisible,
    skipHiddenReplyHandling,
    loadHiddenReplies,
  }: {
    threadgateHiddenReplies: Set<string>
    moderationOpts: ModerationOpts
    hasSession: boolean
    view: PostThreadParams['view']
    hasServerHiddenReplies: boolean
    hiddenRepliesVisible: boolean
    skipHiddenReplyHandling?: boolean
    loadHiddenReplies: () => Promise<void>
  },
) {
  const items: ThreadItem[] = []
  const hidden: ThreadItem[] = []
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
       * Parents are ignored until we find the highlighted post, then we walk
       * _up_ from there.
       */
    } else if (item.depth === 0) {
      if (AppBskyUnspeccedDefs.isThreadItemNoUnauthenticated(item.value)) {
        items.push(views.threadPostNoUnauthenticated(item))
      } else if (AppBskyUnspeccedDefs.isThreadItemNotFound(item.value)) {
        items.push(views.threadPostNotFound(item))
      } else if (AppBskyUnspeccedDefs.isThreadItemBlocked(item.value)) {
        items.push(views.threadPostBlocked(item))
      } else if (AppBskyUnspeccedDefs.isThreadItemPost(item.value)) {
        const post = views.threadPost({
          uri: item.uri,
          depth: item.depth,
          value: item.value,
          moderationOpts,
        })
        items.push(post)

        parentTraversal: for (let pi = i - 1; pi >= 0; pi--) {
          const parent = thread[pi]

          if (
            AppBskyUnspeccedDefs.isThreadItemNoUnauthenticated(parent.value)
          ) {
            items.unshift(views.threadPostNoUnauthenticated(parent))
            break parentTraversal
          } else if (AppBskyUnspeccedDefs.isThreadItemNotFound(parent.value)) {
            items.unshift(views.threadPostNotFound(parent))
            break parentTraversal
          } else if (AppBskyUnspeccedDefs.isThreadItemBlocked(parent.value)) {
            items.unshift(views.threadPostBlocked(parent))
            break parentTraversal
          } else if (AppBskyUnspeccedDefs.isThreadItemPost(parent.value)) {
            items.unshift(
              views.threadPost({
                uri: parent.uri,
                depth: parent.depth,
                value: parent.value,
                moderationOpts,
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
           * Set this value before incrementing the parent's repliesSeenCount
           */
          metadata!.replyIndex = parentMetadata.repliesIndexCount
          // Increment the parent's repliesIndexCount
          parentMetadata.repliesIndexCount += 1
        }

        const post = views.threadPost({
          uri: item.uri,
          depth: item.depth,
          value: item.value,
          moderationOpts,
        })
        const postMod = getModerationState(post.moderation)
        const postIsHiddenByThreadgate = threadgateHiddenReplies.has(item.uri)
        const postIsModerated =
          postIsHiddenByThreadgate || postMod.blurred || postMod.muted

        if (!postIsModerated || skipHiddenReplyHandling) {
          /*
           * Not moderated, probably need to insert it
           */
          items.push(post)

          /*
           * Update seen reply count of parent
           */
          if (parentMetadata) {
            parentMetadata.repliesSeenCount += 1
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
            hidden.push(parent)
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
                   * Set this value before incrementing the parent's repliesIndexCount
                   */
                  childMetadata!.replyIndex =
                    childParentMetadata.repliesIndexCount
                  childParentMetadata.repliesIndexCount += 1
                }

                const childPost = views.threadPost({
                  uri: child.uri,
                  depth: child.depth,
                  value: child.value,
                  moderationOpts,
                })
                const childPostMod = getModerationState(childPost.moderation)
                const childPostIsHiddenByThreadgate =
                  threadgateHiddenReplies.has(child.uri)

                /*
                 * If a child is hidden in any way, drop it an its sub-branch
                 * entirely. To reveal these, the user must navigate to the
                 * parent post directly.
                 */
                if (
                  childPostMod.blurred ||
                  childPostMod.muted ||
                  childPostIsHiddenByThreadgate
                ) {
                  ci = getBranch(thread, ci, child.depth).end
                } else {
                  hidden.push(childPost)
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

  if (!skipHiddenReplyHandling) {
    if (hidden.length || hasServerHiddenReplies) {
      if (hiddenRepliesVisible) {
        items.push(...hidden)
      } else {
        items.push({
          type: 'showHiddenReplies',
          key: 'showHiddenReplies',
          onLoad: loadHiddenReplies,
        })
      }
    }
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const prevItem = items.at(i - 1)
    const nextItem = items.at(i + 1)

    if (item.type === 'threadPost') {
      if (
        item.depth === 0 &&
        !item.value.post.viewer?.replyDisabled &&
        hasSession
      ) {
        items.splice(i + 1, 0, {
          type: 'replyComposer',
          key: 'replyComposer',
        })
        i++ // skip next iteration
      }

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
           * We can now officially calculate `isLastSibling` and `isLastChild`
           * based on the actual data that we've seen.
           */
          metadata.isLastSibling =
            metadata.replyIndex === metadata.parentMetadata.repliesSeenCount - 1
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
          items.splice(i + 1, 0, views.readMore(metadata))
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
          items.splice(
            i + 1,
            0,
            views.readMore(metadata.upcomingParentReadMore),
          )
          i++
        }

        /*
         * Calculate the final UI state for the thread item.
         */
        item.ui = getThreadPostUI(metadata)
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
 *    items[]            (index, depth)
 *      ├── branch ───── (0, 1)
 *      ├─┬ branch ───── (1, 1) (start)
 *      │ ├──┬ leaf ──── (2, 2)
 *      │ │  └── leaf ── (3, 3)
 *      │ └── leaf ───── (4, 2) (end)
 *      ├── branch ───── (5, 1)
 *      ├── branch ───── (6, 1)
 *
 *    const { start: 1, end: 3 } = getBranch(items, 1, 1)
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

export function getModerationState(moderation: ModerationDecision) {
  const modui = moderation.ui('contentList')
  const blurred = modui.blur || modui.filter
  const muted = (modui.blurs[0] || modui.filters[0])?.type === 'muted'
  return {
    blurred,
    muted,
    modui,
  }
}
