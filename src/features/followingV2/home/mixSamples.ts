import {type FeedSource} from '#/features/followingV2/home/api/types'
import {type FeedPostSlice} from '#/features/followingV2/home/queries/postFeed'

/** The parts of a Following page that mixing samples reads. */
type Page = {
  fetchedAt: number
  source?: FeedSource
  slices: FeedPostSlice[]
}

/** The fewest of Following's posts above the first sample. */
const POSTS_BEFORE_SAMPLES = 10

/**
 * The pages that take samples, in the order they were fetched, which is the
 * order batches of samples are given out in. Home's Discover fallback pages
 * don't take any, so the feed past the end of Following is as it is without
 * samples.
 */
export function pagesInSampleOrder<P extends Page>(pages: P[]): P[] {
  return pages
    .filter(page => page.source !== 'discover')
    .sort((a, b) => a.fetchedAt - b.fetchedAt)
}

/**
 * How many of Following's posts go between the `index`th sample and the one
 * before it: 2 to 6, evenly, so about 1 row in 5 is a sample. It's a hash of
 * the seed and the index (murmur3's finalizer), not `Math.random`, so every
 * render lays the samples out the same.
 */
function gap(seed: number, index: number) {
  let h = seed ^ Math.imul(index, 0x9e3779b9)
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b)
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35)
  return 2 + (((h ^ (h >>> 16)) >>> 0) % 5)
}

/**
 * Mixes samples of the user's saved feeds into Following's pages, one after
 * every 2 to 6 of Following's posts, but none above the 10th. The posts are
 * counted across the pages in the order they were fetched, and the nth page
 * fetched gets the nth batch of samples, so a page added at either end, or a
 * batch that arrives late, never moves the samples in the other pages. For the
 * same reason a sample is dropped only if its post is in this page or one
 * fetched before it, or was already sampled into one of those. Samples left
 * over when the page's own posts run out are dropped too.
 *
 * The gaps are jittered by when the first page was fetched, which is the
 * samples query's generation, so only a refresh lays the samples out afresh.
 */
export function mixSamples<P extends Page>(
  pages: P[],
  batches: FeedPostSlice[][],
): P[] {
  const ordered = pagesInSampleOrder(pages)
  const seed = ordered[0]?.fetchedAt ?? 0
  const mixed = new Map<P, P>()
  const seen = new Set<string>()
  let gaps = 0
  /*
   * Following's posts to go until the next sample. The first is jittered like
   * the rest, so it goes after the 10th to 14th post.
   */
  let until = POSTS_BEFORE_SAMPLES - 2 + gap(seed, gaps)
  ordered.forEach((page, rank) => {
    for (const slice of page.slices) {
      for (const item of slice.items) {
        seen.add(item.uri)
      }
    }
    const samples = (batches[rank] ?? []).filter(
      sample => !seen.has(sample.feedPostUri),
    )

    const slices: FeedPostSlice[] = []
    let next = 0
    for (const slice of page.slices) {
      if (until === 0) {
        if (next < samples.length) {
          seen.add(samples[next].feedPostUri)
          slices.push(samples[next])
          next++
        }
        until = gap(seed, ++gaps)
      }
      slices.push(slice)
      until--
    }
    if (next) {
      mixed.set(page, {...page, slices})
    }
  })
  return pages.map(page => mixed.get(page) ?? page)
}
