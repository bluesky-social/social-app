import {type AppBskyFeedPost} from '@atproto/api'

import {
  canEditPost,
  EDIT_WINDOW_MS,
  getPostEditInfo,
  MIN_ACCOUNT_AGE_MS,
} from './edit-post'

const NOW = Date.parse('2026-06-01T00:00:00.000Z')
const OLD_ENOUGH_ACCOUNT = new Date(
  NOW - MIN_ACCOUNT_AGE_MS - 1000,
).toISOString()

function baseArgs(overrides: Partial<Parameters<typeof canEditPost>[0]> = {}) {
  return {
    isAuthor: true,
    createdAt: new Date(NOW - 1000).toISOString(),
    updatedAt: undefined,
    accountCreatedAt: OLD_ENOUGH_ACCOUNT,
    now: NOW,
    ...overrides,
  }
}

describe('canEditPost', () => {
  it('allows editing a fresh post by an eligible author', () => {
    expect(canEditPost(baseArgs())).toBe(true)
  })

  it('rejects non-authors', () => {
    expect(canEditPost(baseArgs({isAuthor: false}))).toBe(false)
  })

  it('rejects an already-edited post', () => {
    expect(
      canEditPost(baseArgs({updatedAt: new Date(NOW).toISOString()})),
    ).toBe(false)
  })

  it('fails closed when account age is unknown', () => {
    expect(canEditPost(baseArgs({accountCreatedAt: undefined}))).toBe(false)
    expect(canEditPost(baseArgs({accountCreatedAt: 'not-a-date'}))).toBe(false)
  })

  it('rejects accounts younger than the minimum age', () => {
    const tooNew = new Date(NOW - MIN_ACCOUNT_AGE_MS + 1000).toISOString()
    expect(canEditPost(baseArgs({accountCreatedAt: tooNew}))).toBe(false)
  })

  it('rejects edits after the window closes', () => {
    const stale = new Date(NOW - EDIT_WINDOW_MS - 1000).toISOString()
    expect(canEditPost(baseArgs({createdAt: stale}))).toBe(false)
  })

  it('allows editing exactly at the window boundary', () => {
    const atBoundary = new Date(NOW - EDIT_WINDOW_MS).toISOString()
    expect(canEditPost(baseArgs({createdAt: atBoundary}))).toBe(true)
  })

  it('fails closed for future-dated or unparseable createdAt', () => {
    expect(
      canEditPost(baseArgs({createdAt: new Date(NOW + 5000).toISOString()})),
    ).toBe(false)
    expect(canEditPost(baseArgs({createdAt: 'not-a-date'}))).toBe(false)
  })
})

describe('getPostEditInfo', () => {
  it('reports an unedited post', () => {
    const record = {
      $type: 'app.bsky.feed.post',
      text: 'hello',
      createdAt: new Date(NOW).toISOString(),
    } as AppBskyFeedPost.Record
    expect(getPostEditInfo(record)).toEqual({
      isEdited: false,
      updatedAt: undefined,
      originalText: undefined,
    })
  })

  it('reports an edited post with its original text', () => {
    const record = {
      $type: 'app.bsky.feed.post',
      text: 'new text',
      createdAt: new Date(NOW - 1000).toISOString(),
      updatedAt: new Date(NOW).toISOString(),
      originalText: 'old text',
    } as AppBskyFeedPost.Record
    expect(getPostEditInfo(record)).toEqual({
      isEdited: true,
      updatedAt: new Date(NOW).toISOString(),
      originalText: 'old text',
    })
  })
})
