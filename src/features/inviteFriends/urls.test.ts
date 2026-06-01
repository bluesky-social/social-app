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
    it('returns the scheme-stripped canonical profile URL', () => {
      expect(getInviteDisplayUrl('danielle.bsky.team')).toBe(
        'bsky.app/profile/danielle.bsky.team',
      )
    })

    it('uses the bare handle when there is no dot', () => {
      expect(getInviteDisplayUrl('alice')).toBe('bsky.app/profile/alice')
    })

    it('lowercases the handle', () => {
      expect(getInviteDisplayUrl('Danielle.bsky.team')).toBe(
        'bsky.app/profile/danielle.bsky.team',
      )
    })

    it('strips a leading @ if present', () => {
      expect(getInviteDisplayUrl('@alice.bsky.social')).toBe(
        'bsky.app/profile/alice.bsky.social',
      )
    })

    it('returns empty string for empty handle (EDGE-001)', () => {
      expect(getInviteDisplayUrl('')).toBe('')
      expect(getInviteDisplayUrl('@')).toBe('')
    })

    it('mirrors getInviteShareUrl exactly minus the scheme', () => {
      expect(getInviteDisplayUrl('alice.bsky.social')).toBe(
        getInviteShareUrl('alice.bsky.social').replace(/^https:\/\//, ''),
      )
    })
  })
})
