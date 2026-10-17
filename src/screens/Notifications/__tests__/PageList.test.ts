import {describe, expect, it, jest} from '@jest/globals'

import {type NotificationView} from '#/state/queries/notifications/grouped/types'
import {
  buildRows,
  getPlaceholderRow,
} from '#/screens/Notifications/components/PageList'

// The placeholder helper doesn't need the native runtime or analytics setup.
jest.mock('#/lib/hooks/useBottomBarOffset', () => ({}))
jest.mock('#/state/queries/notifications/grouped', () => ({}))
jest.mock('#/state/queries/notifications/unread', () => ({}))
jest.mock('#/view/com/util/List', () => ({}))
jest.mock('#/screens/Notifications/components/NotificationItem', () => ({}))
jest.mock('#/screens/Notifications/components/PagerView', () => ({}))
jest.mock('#/screens/Notifications/components/RefreshPill', () => ({}))
jest.mock('#/components/Link', () => ({}))
jest.mock('#/analytics', () => ({}))

describe('getPlaceholderRow', () => {
  it('shows the skeleton before the first load', () => {
    expect(getPlaceholderRow({isError: false, isEmpty: false}).type).toBe(
      'loading',
    )
  })

  it('keeps the skeleton while more pages are on the way', () => {
    // isEmpty is false whenever hasNextPage is true, see PageList
    expect(getPlaceholderRow({isError: false, isEmpty: false}).type).toBe(
      'loading',
    )
  })

  it('shows the empty message once the feed is settled and empty', () => {
    expect(getPlaceholderRow({isError: false, isEmpty: true}).type).toBe(
      'empty',
    )
  })

  it('shows the error over everything else', () => {
    expect(getPlaceholderRow({isError: true, isEmpty: false}).type).toBe(
      'error',
    )
    expect(getPlaceholderRow({isError: true, isEmpty: true}).type).toBe('error')
  })
})

describe('buildRows', () => {
  const today = new Date().toISOString()
  const lastYear = new Date(
    Date.now() - 365 * 24 * 60 * 60 * 1000,
  ).toISOString()

  // Only the fields `buildRows` reads
  function notification(id: string, indexedAt: string) {
    return {id, type: 'like', indexedAt} as unknown as NotificationView
  }

  function layout(notifications: NotificationView[]) {
    return buildRows(notifications, 'all').map(row =>
      row.type === 'section' ? row.section : row.key,
    )
  }

  it('splits notifications into today and earlier', () => {
    expect(
      layout([
        notification('a', today),
        notification('b', today),
        notification('c', lastYear),
      ]),
    ).toEqual(['today', 'a', 'b', 'earlier', 'c'])
  })

  it('leaves the headers out when nothing happened today', () => {
    expect(
      layout([notification('a', lastYear), notification('b', lastYear)]),
    ).toEqual(['a', 'b'])
  })
})
