import {useCallback, useState} from 'react'

import {type ThreadItem} from '#/state/queries/usePostThread'

export function useCollapsibleThreadItems() {
  // only viewable posts can be collapsed
  type CollapsibleThreadItem = Extract<ThreadItem, {type: 'threadPost'}>

  const [collapsedPostUris, setCollapsedPostUris] = useState(
    new Set<CollapsibleThreadItem['uri']>(),
  )

  const isPostCollapsed = useCallback(
    (item: CollapsibleThreadItem) => collapsedPostUris.has(item.uri),
    [collapsedPostUris],
  )

  const togglePostCollapse = useCallback(
    (item: CollapsibleThreadItem) => {
      setCollapsedPostUris(prev => {
        const next = new Set(prev)
        if (!next.delete(item.uri)) next.add(item.uri)
        return next
      })
    },
    [setCollapsedPostUris],
  )

  /**
   * Filters out children of collapsed posts.
   */
  const filterCollapsedChildren = useCallback(
    (threadItems: ThreadItem[]) => {
      if (!collapsedPostUris.size) return threadItems

      const visibleItems: ThreadItem[] = []

      let collapsedAncestor: CollapsibleThreadItem | undefined
      for (const item of threadItems) {
        switch (item.type) {
          case 'readMoreUp':
          case 'replyComposer':
          case 'showOtherReplies':
          case 'skeleton':
            item satisfies Exclude<ThreadItem, {depth: number}>

            if (!collapsedAncestor) {
              visibleItems.push(item)
            }

            break

          case 'readMore':
          case 'threadPost':
          case 'threadPostBlocked':
          case 'threadPostNotFound':
          case 'threadPostNoUnauthenticated':
            item satisfies Extract<ThreadItem, {depth: number}>

            if (collapsedAncestor && collapsedAncestor.depth >= item.depth) {
              // iteration has exited a collapsed subtree
              collapsedAncestor = undefined
            }

            if (!collapsedAncestor) {
              visibleItems.push(item)

              if (
                item.type === 'threadPost' &&
                collapsedPostUris.has(item.uri)
              ) {
                collapsedAncestor = item
              }
            }

            break

          default: // enforce exhaustive switch
            item satisfies never
        }
      }

      return visibleItems
    },
    [collapsedPostUris],
  )

  return {
    filterCollapsedChildren,
    isPostCollapsed,
    togglePostCollapse,
  }
}
