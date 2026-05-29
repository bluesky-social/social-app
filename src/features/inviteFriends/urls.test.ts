import {describe, expect, it} from '@jest/globals'

import {getInviteDisplayUrl, getInviteShareUrl} from './urls'

describe('invite URLs', () => {
  describe('getInviteShareUrl', () => {
    it('returns the canonical profile URL for a handle', () => {
      expect(getInviteShareUrl('alice.bsky.social')).toBe(
        'https://bsky.app/profile/alice.bsky.social',
      )
    })

    it('preserves custom domains', () => {
      expect(getInviteShareUrl('thepope.dev')).toBe(
        'https://bsky.app/profile/thepope.dev',
      )
    })

    it('strips a leading @ if present', () => {
      expect(getInviteShareUrl('@alice.bsky.social')).toBe(
        'https://bsky.app/profile/alice.bsky.social',
      )
    })

    it('lowercases the handle', () => {
      expect(getInviteShareUrl('Alice.Bsky.Social')).toBe(
        'https://bsky.app/profile/alice.bsky.social',
      )
    })

    it('returns empty string for empty handle (EDGE-001)', () => {
      expect(getInviteShareUrl('')).toBe('')
      expect(getInviteShareUrl('@')).toBe('')
    })
  })

  describe('getInviteDisplayUrl', () => {
    it('returns a cosmetic bsky.app/invite/<short> string', () => {
      expect(getInviteDisplayUrl('danielle.bsky.team')).toBe(
        'bsky.app/invite/danielle',
      )
    })

    it('uses the bare handle when there is no dot', () => {
      expect(getInviteDisplayUrl('alice')).toBe('bsky.app/invite/alice')
    })

    it('lowercases the short segment', () => {
      expect(getInviteDisplayUrl('Danielle.bsky.team')).toBe(
        'bsky.app/invite/danielle',
      )
    })

    it('strips a leading @ if present', () => {
      expect(getInviteDisplayUrl('@alice.bsky.social')).toBe(
        'bsky.app/invite/alice',
      )
    })

    it('returns empty string for empty handle (EDGE-001)', () => {
      expect(getInviteDisplayUrl('')).toBe('')
      expect(getInviteDisplayUrl('@')).toBe('')
    })

    it('returns empty string when first segment is empty (EDGE-002)', () => {
      expect(getInviteDisplayUrl('.bsky.social')).toBe('')
      expect(getInviteDisplayUrl('@.bsky.social')).toBe('')
    })
  })
})
