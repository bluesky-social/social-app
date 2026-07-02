import {describe, expect, it} from '@jest/globals'

import {
  makeFilter,
  parseAdvancedSearch,
  serializeAdvancedSearch,
} from '#/screens/Search/components/AdvancedSearchDialog/utils'
import {type SearchFilters} from '#/screens/Search/searchParams'

const emptySerializeState = {
  query: '',
  exactPhrase: '',
  negatedWords: '',
  language: '',
  replies: 'all' as const,
  media: 'all' as const,
  following: 'everyone' as const,
  dateSince: '',
  dateSinceActive: false,
  dateUntil: '',
  dateUntilActive: false,
  filters: [],
}

describe(`AdvancedSearchDialog serialize/parse`, () => {
  it(`splits free text into q and structured fields into filters`, () => {
    const state = parseAdvancedSearch('hello "exact phrase" -spam', {
      author: 'alice',
      domain: 'bsky.app',
      tag: 'atproto bluesky',
      lang: 'en',
      since: '2024-01-01',
      media: 'true',
      replies: 'none',
    })

    expect(state.query).toBe('hello')
    expect(state.exactPhrase).toBe('exact phrase')
    expect(state.negatedWords).toBe('spam')
    expect(state.language).toBe('en')
    expect(state.since).toBe('2024-01-01')
    expect(state.media).toBe('media')
    expect(state.replies).toBe('none')
    // Handle fields (authors/mentions) get a trailing space on parse so the
    // typeahead stays closed until the user types; it's trimmed on serialize.
    expect(state.filters.find(f => f.field === 'authors')?.value).toBe('alice ')
    expect(state.filters.find(f => f.field === 'domains')?.value).toBe(
      'bsky.app',
    )
    expect(state.filters.find(f => f.field === 'tags')?.value).toBe(
      'atproto bluesky',
    )
  })

  it(`lifts operators typed into the query box into include rows`, () => {
    const state = parseAdvancedSearch(
      'chat from:bsky.app to:alice domain:example.com url:example.com/x #atproto since:2024-01-01 until:2024-02-01',
      {},
    )

    // Operators are stripped from the free text.
    expect(state.query).toBe('chat')

    const findRow = (field: string) =>
      state.filters.find(f => f.field === field && f.mode === 'include')?.value
    // Handle fields get a trailing space on parse (trimmed on serialize).
    expect(findRow('authors')).toBe('bsky.app ')
    expect(findRow('mentions')).toBe('alice ')
    expect(findRow('domains')).toBe('example.com')
    expect(findRow('urls')).toBe('example.com/x')
    expect(findRow('tags')).toBe('atproto')
    expect(state.since).toBe('2024-01-01')
    expect(state.until).toBe('2024-02-01')
  })

  it(`keeps from:me in the query box rather than lifting it into a row`, () => {
    const state = parseAdvancedSearch('from:me', {})
    expect(state.query).toBe('from:me')
    expect(state.filters.find(f => f.field === 'authors')).toBeUndefined()
  })

  it(`merges a query-box operator with the matching filter param`, () => {
    const state = parseAdvancedSearch('hi from:bob', {author: 'alice'})
    expect(state.query).toBe('hi')
    expect(
      state.filters.find(f => f.field === 'authors' && f.mode === 'include')
        ?.value,
    ).toBe('alice bob ')
  })

  it(`round-trips state -> {q, filters} -> state`, () => {
    const q = 'hello "exact phrase" -spam'
    const filters: SearchFilters = {
      author: 'alice',
      domain: 'bsky.app',
      url: 'bsky.app/post',
      tag: 'atproto bluesky',
      lang: 'en',
      since: '2024-01-01',
      until: '2024-02-01',
      media: 'true',
      following: 'true',
      replies: 'only',
    }

    const state = parseAdvancedSearch(q, filters)
    const out = serializeAdvancedSearch({
      query: state.query,
      exactPhrase: state.exactPhrase,
      negatedWords: state.negatedWords,
      language: state.language,
      replies: state.replies,
      media: state.media,
      following: state.following,
      dateSince: state.since,
      dateSinceActive: !!state.since,
      dateUntil: state.until,
      dateUntilActive: !!state.until,
      filters: state.filters,
    })

    expect(out.q).toBe(q)
    expect(out.filters).toEqual(filters)
  })

  it(`maps the video media filter to the video param on serialize`, () => {
    const out = serializeAdvancedSearch({
      ...emptySerializeState,
      media: 'video',
    })
    expect(out.filters.video).toBe('true')
    expect(out.filters.media).toBeUndefined()
  })

  it(`parses the video param into the video media filter`, () => {
    const state = parseAdvancedSearch('', {video: 'true'})
    expect(state.media).toBe('video')
  })

  it(`maps the following filter to the following param on serialize`, () => {
    const out = serializeAdvancedSearch({
      ...emptySerializeState,
      following: 'following',
    })
    expect(out.filters.following).toBe('true')
  })

  it(`leaves the following param unset for everyone`, () => {
    const out = serializeAdvancedSearch({
      ...emptySerializeState,
      following: 'everyone',
    })
    expect(out.filters.following).toBeUndefined()
  })

  it(`parses the following param into the following filter`, () => {
    expect(parseAdvancedSearch('', {following: 'true'}).following).toBe(
      'following',
    )
    expect(parseAdvancedSearch('', {}).following).toBe('everyone')
  })

  it(`strips redundant markers from filter values on serialize`, () => {
    const state = parseAdvancedSearch('', {author: 'alice', tag: 'atproto'})
    // simulate a user typing the marker explicitly
    state.filters = state.filters.map(f =>
      f.field === 'authors'
        ? {...f, value: '@alice'}
        : f.field === 'tags'
          ? {...f, value: '#atproto'}
          : f,
    )
    const out = serializeAdvancedSearch({
      query: '',
      exactPhrase: '',
      negatedWords: '',
      language: '',
      replies: 'all',
      media: 'all',
      following: 'everyone',
      dateSince: '',
      dateSinceActive: false,
      dateUntil: '',
      dateUntilActive: false,
      filters: state.filters,
    })
    expect(out.filters.author).toBe('alice')
    expect(out.filters.tag).toBe('atproto')
  })

  it(`merges multiple filter rows of the same field on serialize`, () => {
    const out = serializeAdvancedSearch({
      ...emptySerializeState,
      filters: [
        makeFilter('authors', 'alice'),
        makeFilter('authors', 'bob carol'),
      ],
    })
    expect(out.filters.author).toBe('alice bob carol')
  })

  it(`dedupes duplicate values across rows and within a row on serialize`, () => {
    const out = serializeAdvancedSearch({
      ...emptySerializeState,
      filters: [
        makeFilter('authors', 'alice'),
        makeFilter('authors', 'alice bob'),
        makeFilter('tags', 'cats cats'),
      ],
    })
    expect(out.filters.author).toBe('alice bob')
    expect(out.filters.tag).toBe('cats')
  })

  it(`collapses a merged param back into a single filter row on parse`, () => {
    const state = parseAdvancedSearch('', {author: 'alice bob carol'})
    const authorRows = state.filters.filter(f => f.field === 'authors')
    expect(authorRows).toHaveLength(1)
    // Handle fields get a trailing space on parse (trimmed on serialize).
    expect(authorRows[0].value).toBe('alice bob carol ')
  })

  it(`routes exclude-mode rows to the exclude* params on serialize`, () => {
    const out = serializeAdvancedSearch({
      ...emptySerializeState,
      filters: [
        makeFilter('authors', 'alice', 'include'),
        makeFilter('authors', 'bob', 'exclude'),
        makeFilter('tags', 'spam', 'exclude'),
      ],
    })
    expect(out.filters.author).toBe('alice')
    expect(out.filters.excludeAuthor).toBe('bob')
    expect(out.filters.excludeTag).toBe('spam')
  })

  it(`merges multiple rows of the same field and mode independently`, () => {
    const out = serializeAdvancedSearch({
      ...emptySerializeState,
      filters: [
        makeFilter('domains', 'a.com', 'include'),
        makeFilter('domains', 'b.com', 'include'),
        makeFilter('domains', 'c.com', 'exclude'),
        makeFilter('domains', 'd.com', 'exclude'),
      ],
    })
    expect(out.filters.domain).toBe('a.com b.com')
    expect(out.filters.excludeDomain).toBe('c.com d.com')
  })

  it(`builds exclude-mode rows from exclude* params on parse`, () => {
    const state = parseAdvancedSearch('', {
      author: 'alice',
      excludeAuthor: 'bob',
      excludeTag: 'spam',
    })
    const includeAuthor = state.filters.find(
      f => f.field === 'authors' && f.mode === 'include',
    )
    const excludeAuthor = state.filters.find(
      f => f.field === 'authors' && f.mode === 'exclude',
    )
    const excludeTag = state.filters.find(
      f => f.field === 'tags' && f.mode === 'exclude',
    )
    // Handle fields get a trailing space on parse (trimmed on serialize).
    expect(includeAuthor?.value).toBe('alice ')
    expect(excludeAuthor?.value).toBe('bob ')
    expect(excludeTag?.value).toBe('spam')
  })

  it(`round-trips a mix of include and exclude filters`, () => {
    const filters: SearchFilters = {
      author: 'alice',
      excludeAuthor: 'bob',
      domain: 'bsky.app',
      excludeTag: 'spam',
    }
    const state = parseAdvancedSearch('', filters)
    const out = serializeAdvancedSearch({
      ...emptySerializeState,
      filters: state.filters,
    })
    expect(out.filters).toEqual(filters)
  })

  it(`leaves a negated phrase in the query instead of parsing it`, () => {
    const state = parseAdvancedSearch('-"exact phrase"', {})
    expect(state.query).toBe('-"exact phrase"')
    expect(state.negatedWords).toBe('')
    expect(state.exactPhrase).toBe('')
  })

  it(`leaves a phrase with embedded quotes in the query`, () => {
    const state = parseAdvancedSearch('"say "hi""', {})
    expect(state.query).toBe('"say "hi""')
    expect(state.exactPhrase).toBe('')
  })

  it(`moves quoted negatedWords input to the query verbatim on serialize`, () => {
    const out = serializeAdvancedSearch({
      ...emptySerializeState,
      query: 'cats',
      negatedWords: '"foo" bar',
    })
    // "foo" is unexpected -> verbatim; bar is simple -> negated.
    expect(out.q).toBe('cats "foo" -bar')
  })

  it(`leaves an OR group in the query instead of parsing it`, () => {
    const state = parseAdvancedSearch('hello (cats OR dogs)', {})
    expect(state.query).toBe('hello (cats OR dogs)')
  })
})
