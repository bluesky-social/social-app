import {describe, expect, it, jest} from '@jest/globals'

import {type NotificationView} from '#/state/queries/notifications/grouped/types'
import {getRowBorderColor} from '#/screens/Notifications/components/NotificationItem/Item/Root'
import {
  buildRows,
  getPlaceholderRow,
  isUnreadBorder,
} from '#/screens/Notifications/components/PageList'
import {type Theme} from '#/alf'

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
  function notification(id: string, indexedAt: string, isRead = true) {
    return {id, type: 'like', indexedAt, isRead} as unknown as NotificationView
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

  function dividers(notifications: NotificationView[]) {
    return buildRows(notifications, 'all').map(row =>
      row.type === 'notification' ? row.hasDivider : row.type,
    )
  }

  it('divides notifications from the one above, but not from a header', () => {
    expect(
      dividers([
        notification('a', today),
        notification('b', today),
        notification('c', lastYear),
        notification('d', lastYear),
      ]),
    ).toEqual(['section', false, true, 'section', false, true])
  })

  it('divides every notification but the first without headers', () => {
    expect(
      dividers([notification('a', lastYear), notification('b', lastYear)]),
    ).toEqual([false, true])
  })

  it('counts the borders on both sides of an unread notification', () => {
    const rows = buildRows(
      [
        notification('a', today, false),
        notification('b', today),
        notification('c', lastYear, false),
        notification('d', lastYear),
      ],
      'all',
    )
    // The border above each row, then the one below the last
    expect([
      ...rows.map((row, i) => isUnreadBorder(rows[i - 1], row)),
      isUnreadBorder(rows.at(-1), undefined),
    ]).toEqual([
      false, // above "Today"
      true, // "Today" | a
      true, // a | b
      false, // b | "Earlier"
      true, // "Earlier" | c
      true, // c | d
      false, // below d
    ])
  })
})

describe('getRowBorderColor', () => {
  function theme(name: Theme['name']) {
    return {
      name,
      atoms: {
        border_contrast_low: {borderColor: '#low'},
        border_contrast_medium: {borderColor: '#medium'},
      },
    } as unknown as Theme
  }

  it('is stronger beside an unread row in the dark theme', () => {
    expect(getRowBorderColor(theme('dark'), true)).toBe('#medium')
    expect(getRowBorderColor(theme('dark'), false)).toBe('#low')
  })

  it('is the usual divider colour in the other themes', () => {
    expect(getRowBorderColor(theme('dim'), true)).toBe('#low')
    expect(getRowBorderColor(theme('light'), true)).toBe('#low')
  })
})
