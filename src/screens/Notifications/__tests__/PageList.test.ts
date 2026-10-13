import {describe, expect, it, jest} from '@jest/globals'

import {getPlaceholderRow} from '#/screens/Notifications/components/PageList'

// The placeholder helper doesn't need the native runtime or analytics setup.
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
