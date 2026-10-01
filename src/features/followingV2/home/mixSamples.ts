import {type FeedSource} from '#/features/followingV2/home/api/types'
import {type FeedPostSlice} from '#/features/followingV2/home/queries/postFeed'

/** The parts of a Following page that mixing samples reads. */
type Page = {
  fetchedAt: number
  source?: FeedSource
  slices: FeedPostSlice[]
}

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
 * Whether a row of a page is a sample: the rows Merge used, 8 of every 20,
 * except the first 15 rows of the first page fetched.
 */
function isSampleRow(row: number, rank: number) {
  if (rank === 0 && row < 15) {
    return false
  }
  return row % 4 === 0 || row % 5 === 0
}

/**
 * Mixes samples of the user's saved feeds into Following's pages. The nth page
 * fetched gets the nth batch of samples, so a page added at either end never
 * moves the samples in the pages already there. For the same reason a sample
 * is dropped only if its post is in this page or one fetched before it, or was
 * already sampled into one of those. Samples left over when the page's own
 * posts run out are dropped too.
 */
export function mixSamples<P extends Page>(
  pages: P[],
  batches: FeedPostSlice[][],
): P[] {
  const mixed = new Map<P, P>()
  const seen = new Set<string>()
  pagesInSampleOrder(pages).forEach((page, rank) => {
    for (const slice of page.slices) {
      for (const item of slice.items) {
        seen.add(item.uri)
      }
    }
    const samples = (batches[rank] ?? []).filter(
      sample => !seen.has(sample.feedPostUri),
    )
    if (!samples.length) {
      return
    }

    const slices: FeedPostSlice[] = []
    let next = 0
    for (const slice of page.slices) {
      while (next < samples.length && isSampleRow(slices.length, rank)) {
        seen.add(samples[next].feedPostUri)
        slices.push(samples[next])
        next++
      }
      slices.push(slice)
    }
    mixed.set(page, {...page, slices})
  })
  return pages.map(page => mixed.get(page) ?? page)
}
