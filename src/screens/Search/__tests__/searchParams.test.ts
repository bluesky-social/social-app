import {describe, expect, it} from '@jest/globals'

import {
  countActiveFilters,
  definedFilterParams,
  filtersToApiParams,
  filtersToRouteParams,
  hasPostOnlyFilters,
  parseHistoryEntry,
  readSearchFilters,
  serializeHistoryEntry,
  withoutFilterParams,
} from '#/screens/Search/searchParams'

describe(`searchParams`, () => {
  describe(`readSearchFilters`, () => {
    it(`reads present string filters`, () => {
      expect(
        readSearchFilters({q: 'cats', author: 'alice', domain: 'bsky.app'}),
      ).toEqual({author: 'alice', domain: 'bsky.app'})
    })

    it(`ignores the literal string "undefined"`, () => {
      expect(
        readSearchFilters({
          q: 'cats',
          author: 'alice',
          mentions: 'undefined',
          domain: 'undefined',
        }),
      ).toEqual({author: 'alice'})
    })

    it(`ignores empty and non-string values`, () => {
      expect(readSearchFilters({author: '', tag: undefined})).toEqual({})
    })

    it(`maps a legacy following=true param onto from`, () => {
      expect(readSearchFilters({q: 'cats', following: 'true'})).toEqual({
        from: 'following',
      })
    })

    it(`prefers an explicit from over a legacy following param`, () => {
      expect(readSearchFilters({from: 'me', following: 'true'})).toEqual({
        from: 'me',
      })
    })
  })

  describe(`hasPostOnlyFilters`, () => {
    it(`returns false for a lang-only filter (people/feeds tabs stay)`, () => {
      expect(hasPostOnlyFilters({lang: 'en'})).toBe(false)
    })

    it(`returns false for no filters`, () => {
      expect(hasPostOnlyFilters({})).toBe(false)
    })

    it(`returns true for a post-restricting filter`, () => {
      expect(hasPostOnlyFilters({author: 'alice'})).toBe(true)
      expect(hasPostOnlyFilters({media: 'true'})).toBe(true)
      expect(hasPostOnlyFilters({excludeTag: 'spam'})).toBe(true)
    })

    it(`returns true when lang is combined with a post-only filter`, () => {
      expect(hasPostOnlyFilters({lang: 'en', author: 'alice'})).toBe(true)
    })
  })

  describe(`definedFilterParams`, () => {
    it(`omits absent keys entirely`, () => {
      expect(definedFilterParams({author: 'alice'})).toEqual({author: 'alice'})
    })
  })

  describe(`withoutFilterParams`, () => {
    it(`strips filter keys but keeps q/tab/name`, () => {
      expect(
        withoutFilterParams({
          q: 'cats',
          tab: 'latest',
          name: 'alice',
          author: 'alice',
          domain: 'undefined',
        }),
      ).toEqual({q: 'cats', tab: 'latest', name: 'alice'})
    })

    it(`strips the legacy following key so clearing to Anyone sticks (web)`, () => {
      /*
       * A legacy link carries following=true. Clearing the author filter to
       * Anyone writes no from param, so the stale following key must be
       * dropped or the next read would revive it as from:true.
       */
      const next = {
        ...withoutFilterParams({q: 'cats', following: 'true'}),
        ...definedFilterParams({}),
      }
      expect(next).toEqual({q: 'cats'})
      expect(readSearchFilters(next)).toEqual({})
    })
  })

  describe(`filtersToRouteParams`, () => {
    it(`clears the legacy following key so clearing to Anyone sticks (native)`, () => {
      /*
       * setParams merges, so the rebuilt params must set the legacy following
       * key to undefined to clear it from a legacy-linked session.
       */
      const merged: Record<string, string | undefined> = {
        q: 'cats',
        following: 'true',
        ...filtersToRouteParams({}),
      }
      expect(merged.following).toBeUndefined()
      expect(merged.from).toBeUndefined()
    })
  })

  describe(`filtersToApiParams`, () => {
    it(`splits list fields into arrays and maps v2-only filters`, () => {
      expect(
        filtersToApiParams({
          author: 'alice bob',
          domain: 'bsky.app',
          tag: 'atproto bluesky',
          lang: 'en',
          media: 'true',
          replies: 'none',
        }),
      ).toEqual({
        authors: ['alice', 'bob'],
        domains: ['bsky.app'],
        hashtags: ['atproto', 'bluesky'],
        language: 'en',
        hasMedia: true,
        excludeReplies: true,
      })
    })

    it(`maps video/following and repliesOnly`, () => {
      expect(
        filtersToApiParams({
          video: 'true',
          from: 'following',
          replies: 'only',
        }),
      ).toEqual({
        hasVideo: true,
        following: true,
        repliesOnly: true,
      })
    })

    it(`maps exclude* keys to v2 exclude* arrays`, () => {
      expect(
        filtersToApiParams({
          excludeAuthor: 'alice bob',
          excludeMentions: 'carol',
          excludeDomain: 'spam.com',
          excludeUrl: 'spam.com/x',
          excludeTag: 'nsfw promo',
        }),
      ).toEqual({
        excludeAuthors: ['alice', 'bob'],
        excludeMentions: ['carol'],
        excludeDomains: ['spam.com'],
        excludeUrls: ['spam.com/x'],
        excludeHashtags: ['nsfw', 'promo'],
      })
    })
  })

  describe(`countActiveFilters`, () => {
    it(`counts each set filter key once`, () => {
      expect(countActiveFilters({})).toBe(0)
      expect(
        countActiveFilters({author: 'alice bob', domain: 'bsky.app'}),
      ).toBe(2)
    })
  })

  describe(`search history serialize/parse`, () => {
    it(`stores a filter-less search as a plain string`, () => {
      expect(serializeHistoryEntry('cats', {})).toBe('cats')
    })

    it(`stores a filtered search as JSON`, () => {
      const stored = serializeHistoryEntry('cats', {author: 'alice'})
      expect(stored).not.toBe('cats')
      expect(parseHistoryEntry(stored)).toEqual({
        q: 'cats',
        filters: {author: 'alice'},
      })
    })

    it(`round-trips query + filters`, () => {
      const filters = {
        author: 'alice',
        tag: 'black orange',
        since: '2024-01-01',
      }
      const stored = serializeHistoryEntry('cats', filters)
      expect(parseHistoryEntry(stored)).toEqual({q: 'cats', filters})
    })

    it(`reads a legacy plain-string entry as a query with no filters`, () => {
      expect(parseHistoryEntry('plain old search')).toEqual({
        q: 'plain old search',
        filters: {},
      })
    })

    it(`treats malformed JSON as a plain query without throwing`, () => {
      expect(parseHistoryEntry('{not valid json')).toEqual({
        q: '{not valid json',
        filters: {},
      })
    })

    it(`treats a JSON value lacking a string q as a plain query`, () => {
      const weird = JSON.stringify({foo: 'bar'})
      expect(parseHistoryEntry(weird)).toEqual({q: weird, filters: {}})
    })
  })
})
