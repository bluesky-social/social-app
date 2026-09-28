import {describe, expect, it, jest} from '@jest/globals'

import {
  buildGetQuotesParams,
  fetchNextNonEmptyPage,
  removeDuplicateQuotes,
  RQKEY,
} from '#/state/queries/post-quotes'

jest.mock('#/state/session', () => ({
  useAppviewClient: jest.fn(),
}))
jest.mock('#/analytics', () => ({
  useAnalytics: jest.fn(),
}))

const uri = 'at://did:plc:alice/app.bsky.feed.post/3abc'

describe('buildGetQuotesParams', () => {
  it('omits the sort key when sort is unset', () => {
    const params = buildGetQuotesParams({uri})
    expect('sort' in params).toBe(false)
    expect(params).toEqual({uri, limit: 30, cursor: undefined})
  })

  it('includes sort when set', () => {
    expect(buildGetQuotesParams({uri, sort: 'top'})).toMatchObject({
      sort: 'top',
    })
    expect(buildGetQuotesParams({uri, sort: 'latest'})).toMatchObject({
      sort: 'latest',
    })
  })

  it('passes cursor and limit through', () => {
    expect(buildGetQuotesParams({uri, cursor: 'abc', sort: 'top'})).toEqual({
      uri,
      limit: 30,
      cursor: 'abc',
      sort: 'top',
    })
  })
})

describe('RQKEY', () => {
  it('includes the sort so toggling fetches a fresh list', () => {
    expect(RQKEY(uri, 'top')).not.toEqual(RQKEY(uri, 'latest'))
  })

  it('defaults to latest', () => {
    expect(RQKEY(uri)).toEqual(RQKEY(uri, 'latest'))
    expect(RQKEY(uri)).toEqual(['post-quotes', uri, 'latest'])
  })
})

describe('removeDuplicateQuotes', () => {
  const page = (cursor: string, ...uris: string[]) => ({
    cursor,
    posts: uris.map(u => ({uri: u})),
  })
  const uris = (pages: ReturnType<typeof page>[]) =>
    pages.map(p => p.posts.map(post => post.uri))

  it('keeps the first occurrence across pages', () => {
    const out = removeDuplicateQuotes([
      page('1', 'a', 'b'),
      page('2', 'b', 'c'),
      page('3', 'a', 'd'),
    ])
    expect(uris(out)).toEqual([['a', 'b'], ['c'], ['d']])
    expect(out.map(p => p.cursor)).toEqual(['1', '2', '3'])
  })

  it('removes duplicates within a page', () => {
    expect(uris(removeDuplicateQuotes([page('1', 'a', 'a', 'b')]))).toEqual([
      ['a', 'b'],
    ])
  })

  it('leaves pages without duplicates unchanged', () => {
    const pages = [page('1', 'a'), page('2', 'b')]
    expect(removeDuplicateQuotes(pages)).toEqual(pages)
  })
})

describe('fetchNextNonEmptyPage', () => {
  // Returns a fetchNextPage whose successive pages have the given post counts.
  const fetcher = (
    counts: number[],
    {hasMore = true, isError = false} = {},
  ) => {
    const pages: {posts: unknown[]}[] = []
    return jest.fn(() => {
      pages.push({posts: new Array(counts[pages.length] ?? 0).fill({})})
      return Promise.resolve({
        data: {pages: [...pages]},
        hasNextPage: hasMore && pages.length < counts.length,
        isError,
      })
    })
  }

  it('fetches once when the page has quotes', async () => {
    const fetchNextPage = fetcher([3, 3])
    await fetchNextNonEmptyPage(fetchNextPage)
    expect(fetchNextPage).toHaveBeenCalledTimes(1)
  })

  it('keeps fetching past empty pages', async () => {
    const fetchNextPage = fetcher([0, 0, 2, 2])
    await fetchNextNonEmptyPage(fetchNextPage)
    expect(fetchNextPage).toHaveBeenCalledTimes(3)
  })

  it('stops at the end of the list or on error', async () => {
    const atEnd = fetcher([0, 0])
    await fetchNextNonEmptyPage(atEnd)
    expect(atEnd).toHaveBeenCalledTimes(2)

    const failing = fetcher([0, 0, 0], {isError: true})
    await fetchNextNonEmptyPage(failing)
    expect(failing).toHaveBeenCalledTimes(1)
  })

  it('gives up after a bounded number of empty pages', async () => {
    const fetchNextPage = fetcher(new Array(20).fill(0))
    await fetchNextNonEmptyPage(fetchNextPage)
    expect(fetchNextPage).toHaveBeenCalledTimes(5)
  })
})
