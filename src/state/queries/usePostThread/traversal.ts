import {
  APP_BSKY_UNSPECCED,
  AtUri,
  AppBskyUnspeccedGetPostThreadV2,
  type ModerationDecision,
  type ModerationOpts,
} from '@atproto/api'

import {HiddenReplyKind, type Slice} from '#/state/queries/usePostThread/types'
import * as views from '#/state/queries/usePostThread/views'

export function flatten(
  sorted: ReturnType<typeof sort>,
  {
    hasSession,
    showMuted,
    showHidden,
  }: {
    hasSession: boolean
    showMuted: boolean
    showHidden: boolean
  },
) {
  const flattened: Slice[] = sorted.items

  const unhydratedReplyIntervals = []

  for (let i = 0; i < flattened.length; i++) {
    const item = flattened[i]

    if (item.type === 'threadPost') {
      // TODO should not insert if not found post etc
      if (item.ui.isAnchor && hasSession && !item.value.post.viewer?.replyDisabled) {
        flattened.splice(i + 1, 0, {
          type: 'replyComposer',
          key: 'replyComposer',
        })
      }

      const prev = unhydratedReplyIntervals[unhydratedReplyIntervals.length - 1]

      if (item.annotations.has(APP_BSKY_UNSPECCED.GetPostThreadV2HasMoreReplies)) {
        unhydratedReplyIntervals.push({
          item,
          replyCount: item.value.post.replyCount || 0,
        })
      }

      /*
       * If direct child of previous item with `hasMoreReplies`, subtract 
       */
      if (prev && item.depth === prev.item.depth + 1) {
        prev.replyCount = Math.max(0, prev.replyCount - 1)
      }

      if (prev && item.depth <= prev.item.depth) {
        flattened.splice(i, 0, {
          type: 'readMore',
          key: `readMore:${prev.item.uri}`,
          indent: prev.item.depth + (item.depth < prev.item.depth ? -1 : 0),
          replyCount: prev.replyCount,
          nextAnchor: prev.item,
          nextAnchorUri: new AtUri(prev.item.uri),
        })
        unhydratedReplyIntervals.pop()
      }
    }
  }

  /*
   * Insert hidden items and buttons to show them
   */

  if (sorted.hidden.length) {
    if (showHidden) {
      flattened.push(...sorted.hidden)

      if (sorted.muted.length) {
        if (showMuted) {
          flattened.push(...sorted.muted)
        } else {
          flattened.push({
            type: 'showHiddenReplies',
            key: 'showMutedReplies',
            kind: HiddenReplyKind.Muted,
          })
        }
      }
    } else {
      flattened.push({
        type: 'showHiddenReplies',
        key: 'showHiddenReplies',
        kind: HiddenReplyKind.Hidden,
      })
    }
  } else if (sorted.muted.length) {
    if (showMuted) {
      flattened.push(...sorted.muted)
    } else {
      flattened.push({
        type: 'showHiddenReplies',
        key: 'showMutedReplies',
        kind: HiddenReplyKind.Muted,
      })
    }
  }

  return flattened
}

export function sort(
  thread: AppBskyUnspeccedGetPostThreadV2.OutputSchema['thread'],
  {
    threadgateHiddenReplies,
    moderationOpts,
  }: {
    threadgateHiddenReplies: Set<string>
    moderationOpts: ModerationOpts
  },
) {
  const items: Slice[] = []
  const hidden: Slice[] = []
  const muted: Slice[] = []

  traversal: for (let i = 0; i < thread.length; i++) {
    const item = thread[i]

    if (item.depth < 0) {
      /*
       * Parents are ignored until we find the highlighted post, then we walk
       * _up_ from there.
       */
    } else if (item.depth === 0) {
      if (
        AppBskyUnspeccedGetPostThreadV2.isThreadItemNoUnauthenticated(
          item.value,
        )
      ) {
        items.push(views.threadPostNoUnauthenticated(item))
      } else if (
        AppBskyUnspeccedGetPostThreadV2.isThreadItemNotFound(item.value)
      ) {
        items.push(views.threadPostNotFound(item))
      } else if (
        AppBskyUnspeccedGetPostThreadV2.isThreadItemBlocked(item.value)
      ) {
        items.push(views.threadPostBlocked(item))
      } else if (AppBskyUnspeccedGetPostThreadV2.isThreadItemPost(item.value)) {
        items.push(
          views.threadPost({
            uri: item.uri,
            depth: item.depth,
            value: item.value,
            oneUp: thread[i - 1],
            oneDown: thread[i + 1],
            moderationOpts,
          }),
        )

        parentTraversal: for (let pi = i - 1; pi >= 0; pi--) {
          const parentOneDown = thread[pi + 1]
          const parent = thread[pi]
          const parentOneUp = thread[pi - 1]

          if (
            AppBskyUnspeccedGetPostThreadV2.isThreadItemNoUnauthenticated(
              parent.value,
            )
          ) {
            items.unshift(views.threadPostNoUnauthenticated(parent))
            break parentTraversal
          } else if (
            AppBskyUnspeccedGetPostThreadV2.isThreadItemNotFound(parent.value)
          ) {
            items.unshift(views.threadPostNotFound(parent))
            break parentTraversal
          } else if (
            AppBskyUnspeccedGetPostThreadV2.isThreadItemBlocked(parent.value)
          ) {
            items.unshift(views.threadPostBlocked(parent))
            break parentTraversal
          } else if (
            AppBskyUnspeccedGetPostThreadV2.isThreadItemPost(parent.value)
          ) {
            items.unshift(
              views.threadPost({
                uri: parent.uri,
                depth: parent.depth,
                value: parent.value,
                oneUp: parentOneUp,
                oneDown: parentOneDown,
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
        AppBskyUnspeccedGetPostThreadV2.isThreadItemNoUnauthenticated(
          item.value,
        ) ||
        AppBskyUnspeccedGetPostThreadV2.isThreadItemNotFound(item.value) ||
        AppBskyUnspeccedGetPostThreadV2.isThreadItemBlocked(item.value)

      if (shouldBreak) {
        const branch = getBranch(thread, i, item.depth)
        // could insert tombstone
        i = branch.end
        continue traversal
      } else if (AppBskyUnspeccedGetPostThreadV2.isThreadItemPost(item.value)) {
        const oneUp = thread.at(i - 1)
        const oneDown = thread.at(i + 1)
        const post = views.threadPost({
          uri: item.uri,
          depth: item.depth,
          value: item.value,
          oneUp,
          oneDown,
          moderationOpts,
        })
        const postMod = getModerationState(post.moderation)
        const postIsHiddenByThreadgate = threadgateHiddenReplies.has(item.uri)
        const postIsModerated =
          postIsHiddenByThreadgate || postMod.blurred || postMod.muted

        if (!postIsModerated) {
          /*
           * Not moderated, probably need to insert it
           */
          items.push(post)
        } else {
          /*
           * Moderated in some way, we're going to walk children
           */
          const parent = post
          const parentMod = postMod
          const parentIsTopLevelReply = parent.depth === 1
          const sortArray = parentMod.muted ? muted : hidden

          // get sub tree
          const branch = getBranch(thread, i, item.depth)

          if (parentIsTopLevelReply) {
            // push branch anchor into sorted array
            sortArray.push(parent)
            // skip branch anchor in branch traversal
            const startIndex = branch.start + 1

            for (let ci = startIndex; ci <= branch.end; ci++) {
              const child = thread[ci]

              if (
                AppBskyUnspeccedGetPostThreadV2.isThreadItemPost(child.value)
              ) {
                const childPost = views.threadPost({
                  uri: child.uri,
                  depth: child.depth,
                  value: child.value,
                  oneUp: thread[ci - 1],
                  oneDown: thread[ci + 1],
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
                  sortArray.push(childPost)
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

  return {
    items,
    hidden,
    muted,
  }
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
  thread: AppBskyUnspeccedGetPostThreadV2.OutputSchema['thread'],
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
  }
}
