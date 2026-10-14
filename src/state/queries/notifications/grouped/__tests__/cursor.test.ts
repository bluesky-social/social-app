import {describe, expect, it} from '@jest/globals'

import {getNextCursor} from '#/state/queries/notifications/grouped/cursor'
import {type NotificationView} from '#/state/queries/notifications/grouped/types'

// Only the length of a page's notifications matters here
const SOME = [{}] as NotificationView[]
const NONE: NotificationView[] = []

function pages(...notifications: NotificationView[][]) {
  return notifications.map((page, index) => ({
    cursor: `cursor-${index}`,
    notifications: page,
  }))
}

describe('getNextCursor', () => {
  it('continues from the last page', () => {
    expect(getNextCursor(pages(SOME, SOME))).toBe('cursor-1')
  })

  it('continues through a few empty pages', () => {
    expect(getNextCursor(pages(SOME, NONE, NONE, NONE, NONE))).toBe('cursor-4')
  })

  it('gives up after five empty pages in a row', () => {
    expect(getNextCursor(pages(SOME, NONE, NONE, NONE, NONE, NONE))).toBe(
      undefined,
    )
    expect(getNextCursor(pages(NONE, NONE, NONE, NONE, NONE))).toBe(undefined)
  })

  it('starts counting again after a page with notifications', () => {
    expect(getNextCursor(pages(NONE, NONE, NONE, NONE, SOME, NONE, NONE))).toBe(
      'cursor-6',
    )
  })

  it('ends when the server sends no cursor', () => {
    expect(getNextCursor([{cursor: undefined, notifications: SOME}])).toBe(
      undefined,
    )
  })
})
