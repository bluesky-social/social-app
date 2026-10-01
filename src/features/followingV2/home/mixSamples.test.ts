import {type FeedSource} from '#/features/followingV2/home/api/types'
import {type FeedPostSlice} from '#/features/followingV2/home/queries/postFeed'
import {mixSamples} from './mixSamples'

type Page = {fetchedAt: number; source?: FeedSource; slices: FeedPostSlice[]}

function slice(name: string): FeedPostSlice {
  const uri = `at://did:plc:author/app.bsky.feed.post/${name}`
  return {
    _reactKey: name,
    feedPostUri: uri,
    items: [{uri}],
  } as unknown as FeedPostSlice
}

/** A page of `count` posts named `<name>-<i>`. */
function page(name: string, fetchedAt: number, count = 30): Page {
  return {
    fetchedAt,
    slices: Array.from({length: count}, (_, i) => slice(`${name}-${i}`)),
  }
}

/** A batch of `count` samples named `<name>-<i>`. */
function batch(name: string, count = 30) {
  return Array.from({length: count}, (_, i) => slice(`${name}-${i}`))
}

/** Each page's rows, by name. */
function rows(pages: Page[]) {
  return pages.map(p => p.slices.map(s => s._reactKey))
}

/** The rows of a page that are samples from `name`. */
function sampleRows(p: Page, name: string) {
  return p.slices.flatMap((s, i) => (s._reactKey.startsWith(name) ? [i] : []))
}

describe('mixSamples', () => {
  it('keeps the first 15 rows of the first page to Following', () => {
    const [mixed] = mixSamples([page('a', 1)], [batch('s')])

    // Merge's rows, 8 of every 20, from row 15 until Following's posts run out.
    expect(sampleRows(mixed, 's')).toEqual([
      15, 16, 20, 24, 25, 28, 30, 32, 35, 36,
    ])
    expect(mixed.slices.at(-1)?._reactKey).toBe('a-29')
  })

  it('samples from the top of a later page', () => {
    const [, mixed] = mixSamples(
      [page('a', 1), page('b', 2, 10)],
      [batch('s'), batch('t')],
    )

    expect(sampleRows(mixed, 't')).toEqual([0, 4, 5, 8, 10, 12, 15, 16])
    expect(mixed.slices.at(-1)?._reactKey).toBe('b-9')
  })

  it('gives batches out in the order pages were fetched', () => {
    const mixed = mixSamples(
      [page('new', 2), page('old', 1)],
      [batch('first'), batch('second')],
    )

    expect(sampleRows(mixed[0], 'second').length).toBeGreaterThan(0)
    expect(sampleRows(mixed[0], 'first')).toEqual([])
    expect(sampleRows(mixed[1], 'first').length).toBeGreaterThan(0)
    expect(sampleRows(mixed[1], 'second')).toEqual([])
  })

  it('never moves the samples already shown when a page is added at either end', () => {
    const batches = [batch('s'), batch('t'), batch('u'), batch('v')]
    const a = page('a', 1)
    const b = page('b', 2)
    const before = rows(mixSamples([a, b], batches))

    const appended = rows(mixSamples([a, b, page('c', 3)], batches))
    expect(appended.slice(0, 2)).toEqual(before)

    const prepended = rows(
      mixSamples([page('d', 4), a, b, page('c', 3)], batches),
    )
    expect(prepended.slice(1, 3)).toEqual(before)
    expect(prepended[3]).toEqual(appended[2])
    // The page added last takes the next batch, wherever it goes.
    expect(prepended[0].some(row => row.startsWith('v-'))).toBe(true)
  })

  it('drops samples already in this page or an earlier one', () => {
    const [first, second] = mixSamples(
      [page('a', 1), page('b', 2)],
      [
        [slice('a-0'), ...batch('s')],
        [
          slice('a-1'),
          slice('b-2'),
          slice('s-0'),
          slice('later'),
          ...batch('t'),
        ],
      ],
    )

    expect(rows([first])[0].filter(row => row === 'a-0')).toHaveLength(1)
    expect(rows([second])[0].slice(0, 2)).toEqual(['later', 'b-0'])
  })

  it('keeps a sample whose post only shows up in a page fetched later', () => {
    const [first] = mixSamples(
      [page('a', 1, 20), {fetchedAt: 2, slices: [slice('b-0')]}],
      [[slice('b-0')], []],
    )

    expect(rows([first])[0][15]).toBe('b-0')
  })

  it('leaves Discover fallback pages out', () => {
    const discover = {...page('d', 2), source: 'discover' as const}
    const mixed = mixSamples(
      [page('a', 1), discover, page('b', 3)],
      [batch('s'), batch('t')],
    )

    expect(mixed[1]).toBe(discover)
    expect(sampleRows(mixed[2], 't').length).toBeGreaterThan(0)
  })

  it('leaves a page alone without samples for it', () => {
    const a = page('a', 1)

    expect(mixSamples([a], [])[0]).toBe(a)
  })
})
