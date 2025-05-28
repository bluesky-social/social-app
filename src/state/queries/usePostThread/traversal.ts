import {
  AppBskyUnspeccedGetPostThreadV2,
  type ModerationDecision,
  type ModerationOpts,
} from '@atproto/api'

import {
  HiddenReplyKind,
  type PostThreadParams,
  type Slice,
  type TraversalMetadata,
} from '#/state/queries/usePostThread/types'
import {
  getPostRecord,
  getThreadPostUI,
  getTraversalMetadata,
} from '#/state/queries/usePostThread/utils'
import * as views from '#/state/queries/usePostThread/views'

export function flatten(
  sorted: ReturnType<typeof sort>,
  {
    hasSession,
    showMuted,
    showHidden,
    view,
  }: {
    hasSession: boolean
    showMuted: boolean
    showHidden: boolean
    view: PostThreadParams['view']
  },
) {
  const flattened: Slice[] = sorted.items
  const parents = []

  for (let i = 0; i < flattened.length; i++) {
    const item = flattened[i]

    if (item.type === 'threadPost') {
      // TODO should not insert if not found post etc
      if (
        item.ui.isAnchor &&
        hasSession &&
        !item.value.post.viewer?.replyDisabled
      ) {
        flattened.splice(i + 1, 0, {
          type: 'replyComposer',
          key: 'replyComposer',
        })
      }

      const deepestParent = parents[parents.length - 1]

      if (deepestParent) {
        // next item is a sibling or an aunt/uncle
        if (item.depth <= deepestParent.depth) {
          for (let pi = parents.length - 1; pi >= 0; pi--) {
            const parent = parents[pi]

            if (item.depth <= parent.depth) {
              /*
               * Find the previous post item and set the read more flags
               */
              for (let ui = i - 1; ui >= 0; ui--) {
                let prev = flattened[ui]
                if (prev.type === 'threadPost') {
                  prev.ui.precedesParentReadMore =
                    prev.ui.indent - 1 === parent.ui.indent // true
                  prev.ui.precedesChildReadMore =
                    prev.ui.indent === item.ui.indent
                  break
                }
              }

              flattened.splice(
                i + 1 + (pi - parents.length),
                0,
                views.readMore({
                  parent,
                }),
              )
              parents.pop()

              // skip next iteration
              i++

              if (view === 'linear') {
                break
              }
            } else {
              break
            }
          }
        }
      }

      if (item.value.moreReplies > 0) {
        parents.push(item)
      }

      const isLastIteration = i === flattened.length - 1

      if (isLastIteration) {
        const deepestParent = parents[parents.length - 1]

        if (deepestParent) {
          // next item is a sibling or an aunt/uncle
          if (deepestParent.depth <= item.depth) {
            for (let pi = parents.length - 1; pi >= 0; pi--) {
              const parent = parents[pi]
              if (parent.depth <= item.depth) {
                /*
                 * Find the previous post item and set the read more flags
                 */
                for (let ui = i; ui >= 0; ui--) {
                  let prev = flattened[ui]
                  if (prev.type === 'threadPost') {
                    prev.ui.precedesParentReadMore =
                      prev.ui.indent - 1 === parent.ui.indent
                    prev.ui.precedesChildReadMore =
                      prev.ui.indent === item.ui.indent
                    break
                  }
                }

                flattened.splice(
                  i + 2 + (pi - parents.length),
                  0,
                  views.readMore({
                    parent,
                  }),
                )
                parents.pop()

                // skip next iteration
                i++

                if (view === 'linear') {
                  break
                }
              } else {
                break
              }
            }
          }
        }
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
  const metadatas = new Map<string, TraversalMetadata>()

  // @ts-ignore
  window.__data = metadatas // for debugging

  traversal: for (let i = 0; i < thread.length; i++) {
    const item = thread[i]
    let parentMetadata: TraversalMetadata | undefined
    let metadata: TraversalMetadata | undefined

    if (AppBskyUnspeccedGetPostThreadV2.isThreadItemPost(item.value)) {
      parentMetadata = metadatas.get(
        getPostRecord(item.value.post).reply?.parent?.uri || '',
      )
      metadata = getTraversalMetadata({
        item,
        parentMetadata,
        prevItem: thread.at(i - 1),
        nextItem: thread.at(i + 1),
      })
      metadatas.set(item.uri, metadata)
      metadatas.set(metadata.text, metadata) // TODO debugging
    }

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
        if (parentMetadata) {
          parentMetadata.seenReplies += 1
          if (metadata) {
            metadata.isLastSibling =
              parentMetadata.replies === parentMetadata.seenReplies
          }
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
                const childParentMetadata = metadatas.get(
                  getPostRecord(child.value.post).reply?.parent?.uri || '',
                )
                const childMetadata = getTraversalMetadata({
                  item: child,
                  prevItem: thread[ci - 1],
                  nextItem: thread[ci + 1],
                  parentMetadata: childParentMetadata,
                })
                if (childParentMetadata) {
                  childParentMetadata.seenReplies += 1
                  childMetadata.isLastSibling =
                    childParentMetadata.replies ===
                    childParentMetadata.seenReplies
                }
                metadatas.set(item.uri, childMetadata)
                metadatas.set(childMetadata.text, childMetadata) // TODO debugging

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

  for (const item of items) {
    if (item.type === 'threadPost') {
      const metadata = metadatas.get(item.uri)
      if (metadata) {
        if (metadata.parentMetadata) {
          metadata.skippedIndents = new Set([
            ...metadata.parentMetadata.skippedIndents,
          ])
        }
        if (metadata.isLastSibling) {
          metadata.skippedIndents.add(item.depth - 2)
        }

        item.ui = getThreadPostUI(metadata)
      }
    }
  }

  // console.log(metadatas)

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
