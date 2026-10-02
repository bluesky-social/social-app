import {type FeedSource} from '#/features/followingV2/home/api/types'
import {type FeedPostSlice} from '#/features/followingV2/home/queries/postFeed'
import {mixSamples} from './mixSamples'

type Page = {fetchedAt: number; source?: FeedSource; slices: FeedPostSlice[]}

/** Seeds like the `fetchedAt` of a first page. */
const SEEDS = Array.from({length: 100}, (_, i) => 1_760_000_000_000 + i * 1009)

function slice(name: string): FeedPostSlice {
  const uri = `at://did:plc:author/app.bsky.feed.post/${name}`
  return {
    _reactKey: name,
    feedPostUri: uri,
    items: [{uri}],
  } as unknown as FeedPostSlice
}

/** A page of `count` posts named `<name>-<i>`. */
function page(name: string, fetchedAt: number, count = 15): Page {
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

/**
 * All the rows of a Following feed whose first page was fetched at `seed`, with
 * pages `p<i>` taking samples `s<i>-<j>`.
 */
function feed(seed: number, pageCount = 10) {
  const pages = Array.from({length: pageCount}, (_, i) =>
    page(`p${i}`, seed + i),
  )
  return rows(
    mixSamples(
      pages,
      pages.map((_, i) => batch(`s${i}`)),
    ),
  ).flat()
}

/** How many of Following's posts are above each sample, back to the last. */
function gaps(feedRows: string[]) {
  const out: number[] = []
  let run = 0
  for (const row of feedRows) {
    if (row.startsWith('s')) {
      out.push(run)
      run = 0
    } else {
      run++
    }
  }
  return out
}

describe('mixSamples', () => {
  it('keeps samples below the 10th post, and samples a typical first page', () => {
    for (const seed of SEEDS) {
      const [mixed] = mixSamples([page('a', seed)], [batch('s')])
      const samples = sampleRows(mixed, 's')

      expect(samples.length).toBeGreaterThan(0)
      expect(samples[0]).toBeGreaterThanOrEqual(10)
      expect(samples[0]).toBeLessThanOrEqual(14)
      expect(mixed.slices.at(-1)?._reactKey).toBe('a-14')
    }
  })

  it('puts 2 to 6 of Following’s posts between samples', () => {
    const seen = new Set<number>()
    for (const seed of SEEDS) {
      const [, ...between] = gaps(feed(seed))
      for (const gap of between) {
        expect(gap).toBeGreaterThanOrEqual(2)
        expect(gap).toBeLessThanOrEqual(6)
        seen.add(gap)
      }
    }
    expect([...seen].sort((x, y) => x - y)).toEqual([2, 3, 4, 5, 6])
  })

  it('makes about 1 row in 5 a sample', () => {
    for (const seed of SEEDS) {
      // 67 pages of 15 is 1005 of Following's posts.
      const feedRows = feed(seed, 67)
      const density = gaps(feedRows).length / feedRows.length

      expect(density).toBeGreaterThan(0.18)
      expect(density).toBeLessThan(0.22)
    }
  })

  it('lays samples out the same for a seed, and afresh for another', () => {
    expect(feed(SEEDS[0])).toEqual(feed(SEEDS[0]))
    expect(feed(SEEDS[0])).not.toEqual(feed(SEEDS[1]))
    expect(new Set(SEEDS.map(seed => feed(seed).join())).size).toBe(
      SEEDS.length,
    )
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

  it('never moves the samples in other pages when a batch arrives late', () => {
    const pages = [page('a', 1), page('b', 2), page('c', 3)]
    const arrived = mixSamples(pages, [batch('s'), batch('t'), batch('u')])
    const late = mixSamples(pages, [batch('s'), [], batch('u')])
    const short = mixSamples(pages, [batch('s', 1), batch('t'), batch('u')])

    expect(late[1]).toBe(pages[1])
    expect(sampleRows(arrived[1], 't').length).toBeGreaterThan(0)
    expect(rows([late[0], late[2]])).toEqual(rows([arrived[0], arrived[2]]))
    expect(rows(short.slice(1))).toEqual(rows(arrived.slice(1)))
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
    expect(rows([first])[0]).toContain('s-0')
    expect(rows([second])[0].find(row => !row.startsWith('b-'))).toBe('later')
  })

  it('keeps a sample whose post only shows up in a page fetched later', () => {
    const [first] = mixSamples(
      [page('a', 1, 20), {fetchedAt: 2, slices: [slice('b-0')]}],
      [[slice('b-0')], []],
    )

    expect(rows([first])[0]).toContain('b-0')
  })

  it('leaves Discover fallback pages out, and doesn’t count their posts', () => {
    const a = page('a', 1)
    const b = page('b', 3)
    const discover = {...page('d', 2), source: 'discover' as const}
    const without = mixSamples([a, b], [batch('s'), batch('t')])
    const mixed = mixSamples([a, discover, b], [batch('s'), batch('t')])

    expect(mixed[1]).toBe(discover)
    expect(sampleRows(mixed[2], 't').length).toBeGreaterThan(0)
    expect(rows([mixed[0], mixed[2]])).toEqual(rows(without))
  })

  it('leaves a page alone without samples for it', () => {
    const a = page('a', 1)

    expect(mixSamples([a], [])[0]).toBe(a)
  })
})
