import {
  AppBskyUnspeccedDefs,
  type AppBskyUnspeccedGetPostThreadV2,
  type ModerationDecision,
  type ModerationOpts,
} from '@atproto/api'

import {HiddenReplyKind,type Slice} from '#/state/queries/usePostThread/types'
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
  const flattened: Slice[] = sorted.slices

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

  if (hasSession) {
    for (let i = 0; i < flattened.length; i++) {
      const slice = flattened[i]
      if ('slice' in slice && slice.slice.depth === 0) {
        flattened.splice(i + 1, 0, {
          type: 'replyComposer',
          key: 'replyComposer',
        })
        break
      }
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
  const slices: Slice[] = []
  const hidden: Slice[] = []
  const muted: Slice[] = []

  traversal: for (let i = 0; i < thread.length; i++) {
    const item = thread[i]

    // ignore unknowns
    if (!('depth' in item)) continue

    if (item.depth < 0) {
      /*
       * Parents are ignored until we find the highlighted post, then we walk
       * _up_ from there.
       */
    } else if (item.depth === 0) {
      if (AppBskyUnspeccedDefs.isThreadItemNoUnauthenticated(item)) {
        slices.push(views.noUnauthenticated({item}))
      } else if (AppBskyUnspeccedDefs.isThreadItemNotFound(item)) {
        slices.push(views.notFound({item}))
      } else if (AppBskyUnspeccedDefs.isThreadItemBlocked(item)) {
        slices.push(views.blocked({item}))
      } else if (AppBskyUnspeccedDefs.isThreadItemPost(item)) {
        slices.push(
          views.post({
            item,
            oneUp: thread[i - 1],
            oneDown: thread[i + 1],
            moderationOpts,
          }),
        )

        parentTraversal: for (let pi = i - 1; pi >= 0; pi--) {
          const parentOneDown = thread[pi + 1]
          const parent = thread[pi]
          const parentOneUp = thread[pi - 1]

          if (AppBskyUnspeccedDefs.isThreadItemNoUnauthenticated(parent)) {
            slices.unshift(views.noUnauthenticated({item: parent}))
            break parentTraversal
          } else if (AppBskyUnspeccedDefs.isThreadItemNotFound(parent)) {
            slices.unshift(views.notFound({item: parent}))
            break parentTraversal
          } else if (AppBskyUnspeccedDefs.isThreadItemBlocked(parent)) {
            slices.unshift(views.blocked({item: parent}))
            break parentTraversal
          } else if (AppBskyUnspeccedDefs.isThreadItemPost(parent)) {
            slices.unshift(
              views.post({
                item: parent,
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
        AppBskyUnspeccedDefs.isThreadItemNoUnauthenticated(item) ||
        AppBskyUnspeccedDefs.isThreadItemNotFound(item) ||
        AppBskyUnspeccedDefs.isThreadItemBlocked(item)

      if (shouldBreak) {
        const branch = getBranch(thread, i, item.depth)
        // could insert tombstone
        i = branch.end
        continue traversal
      } else if (AppBskyUnspeccedDefs.isThreadItemPost(item)) {
        const lastSlice = slices[slices.length - 1]
        const isFirstReply =
          lastSlice.type === 'replyComposer' ||
          (lastSlice.type === 'threadSlice' && lastSlice.slice.depth === 0)
        const parent = views.post({
          item,
          oneUp: isFirstReply ? undefined : thread[i - 1],
          oneDown: thread[i + 1],
          moderationOpts,
        })
        const parentMod = getModerationState(parent.moderation)
        const parentIsHidden = threadgateHiddenReplies.has(item.uri)
        const parentIsTopLevelReply = item.depth === 1
        const parentIsModerated =
          parentIsHidden || parentMod.blurred || parentMod.muted

        if (!parentIsModerated) {
          /*
           * Not hidden, so show it
           */
          slices.push(parent)
        } else {
          const branch = getBranch(thread, i, item.depth)
          const sortArray = parentMod.muted ? muted : hidden

          if (parentIsTopLevelReply) {
            // push branch anchor into sorted array
            sortArray.push(parent)
            // skip branch anchor in branch traversal
            const startIndex = branch.start + 1

            for (let ci = startIndex; ci <= branch.end; ci++) {
              const child = thread[ci]

              if (AppBskyUnspeccedDefs.isThreadItemPost(child)) {
                const childPost = views.post({
                  item: child,
                  oneUp: thread[ci - 1],
                  oneDown: thread[ci + 1],
                  moderationOpts,
                })
                const childMod = getModerationState(childPost.moderation)
                const childIsHidden = threadgateHiddenReplies.has(child.uri)

                /*
                 * If a child is hidden in any way, drop it an its sub-branch
                 * entirely. To reveal these, the user must navigate to the
                 * parent post directly.
                 */
                if (childMod.blurred || childMod.muted || childIsHidden) {
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
    slices,
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
function getBranch(
  thread: AppBskyUnspeccedGetPostThreadV2.OutputSchema['thread'],
  branchStartIndex: number,
  branchStartDepth: number,
) {
  let end = branchStartIndex

  for (let ci = branchStartIndex + 1; ci < thread.length; ci++) {
    const next = thread[ci]
    // ignore unknowns
    if (!('depth' in next)) continue
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
