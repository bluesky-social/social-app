import {
  countActiveFilters,
  definedFilterParams,
  filtersToApiParams,
  filtersToLegacyParams,
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
  })

  describe(`filtersToLegacyParams`, () => {
    it(`maps structured filters back to legacy query operators`, () => {
      expect(
        filtersToLegacyParams({
          author: 'alice',
          mentions: 'bob',
          domain: 'bsky.app',
          url: 'bsky.app/x',
          tag: 'atproto',
          lang: 'en',
          since: '2024-01-01',
          until: '2024-02-01',
          media: 'true',
          replies: 'none',
        }),
      ).toEqual({
        from: 'alice',
        mentions: 'bob',
        domain: 'bsky.app',
        url: 'bsky.app/x',
        tag: 'atproto',
        lang: 'en',
        since: '2024-01-01',
        until: '2024-02-01',
      })
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
          following: 'true',
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
