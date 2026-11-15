import {type GroupedNotificationsPage} from './types'

/**
 * How many pages in a row can come back empty before the feed is treated as
 * finished, as `useAutoPagination` allows.
 */
const MAX_EMPTY_PAGES = 5

/**
 * The cursor for the page after `pages`, or undefined once the feed is done.
 *
 * The server can keep returning a cursor for pages whose groups all get
 * dropped while hydrating. On web the end of the list stays in view, so it
 * would ask for page after page forever. Giving up after a run of empty pages
 * ends it, and the screen shows the end of the feed, or its empty state.
 */
export function getNextCursor(
  pages: Pick<GroupedNotificationsPage, 'cursor' | 'notifications'>[],
) {
  let emptyPages = 0
  for (let i = pages.length - 1; i >= 0; i--) {
    if (pages[i].notifications.length > 0) break
    emptyPages++
  }
  if (emptyPages >= MAX_EMPTY_PAGES) return undefined
  return pages.at(-1)?.cursor
}
