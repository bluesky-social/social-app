import {
  AppBskyUnspeccedDefs,
  type AppBskyUnspeccedGetPostThreadV2,
} from '@atproto/api'

import {SELF_THREAD_CHAIN_MAX_FETCHES} from '#/state/queries/usePostThread/const'

type RawThreadItem = AppBskyUnspeccedGetPostThreadV2.ThreadItem

function isOpChainPost(
  item: RawThreadItem,
  did: string,
): item is RawThreadItem & {
  value: AppBskyUnspeccedDefs.ThreadItemPost
} {
  return (
    AppBskyUnspeccedDefs.isThreadItemPost(item.value) &&
    item.value.opThread &&
    item.value.post.author.did === did
  )
}

/**
 * Locates the OP self-thread chain hanging off the response anchor: the first
 * depth-1 `opThread` post by `did`, plus the contiguous one-level-deeper run
 * below it. Mirrors the chain walk in PostThread/reader.ts, but over raw
 * response items. Chain items are contiguous indices `start..end` because
 * branches are served depth-first.
 */
function findChain(
  thread: RawThreadItem[],
  did: string,
): {start: number; end: number} | undefined {
  const start = thread.findIndex(
    item => item.depth === 1 && isOpChainPost(item, did),
  )
  if (start === -1) return undefined
  let end = start
  while (end + 1 < thread.length) {
    const next = thread[end + 1]
    if (next.depth === thread[end].depth + 1 && isOpChainPost(next, did)) {
      end++
    } else {
      break
    }
  }
  return {start, end}
}

/**
 * The endpoint caps the depth served per request, and linear-shaped fetches
 * descend the OP self-thread one level per post, so a long enough
 * self-thread arrives truncated. When the chain ends at the depth cap,
 * refetch anchored at the deepest post and splice the continuation into the
 * response, repeating until the chain ends naturally or `maxFetches` is
 * reached.
 *
 * The cap is whatever the server actually enforces, which can be lower than
 * the requested `below` (the appview currently clamps to 10 despite the
 * lexicon allowing 20), so truncation is detected structurally: a chain tip
 * with no hydrated child sat at the cap, while a tip followed by any
 * hydrated child - another author's reply, a tombstone - ended for real.
 *
 * The splice keeps the response linear-shaped (depth-first, depths made
 * absolute), so downstream traversal and the reader transform are unaware of
 * the stitching. The old tip's `moreReplies` is decremented since its chain
 * continuation is now present in the response - reader seam counts rely on
 * that value being exact, see `createSeam` in PostThread/reader.ts.
 */
export async function extendSelfThreadChain({
  thread,
  maxFetches = SELF_THREAD_CHAIN_MAX_FETCHES,
  fetchBelow,
}: {
  thread: RawThreadItem[]
  maxFetches?: number
  /** Fetches more levels anchored at the given post, without parents. */
  fetchBelow: (anchorUri: string) => Promise<RawThreadItem[]>
}): Promise<RawThreadItem[]> {
  const anchor = thread.find(item => item.depth === 0)
  if (!anchor || !AppBskyUnspeccedDefs.isThreadItemPost(anchor.value)) {
    return thread
  }
  const did = anchor.value.post.author.did

  const chain = findChain(thread, did)
  if (!chain) return thread

  let result = thread
  let tipIndex = chain.end
  let tipMaybeTruncated = !hasHydratedChild(thread, chain.end)

  for (let i = 0; i < maxFetches && tipMaybeTruncated; i++) {
    const tip = result[tipIndex]
    const tipValue = tip.value
    if (!AppBskyUnspeccedDefs.isThreadItemPost(tipValue)) break
    if (tipValue.moreReplies === 0 && (tipValue.post.replyCount ?? 0) === 0) {
      // the tip has no replies at all, so there is nothing to extend
      break
    }

    const continuation = await fetchBelow(tip.uri)
    const contChain = findChain(continuation, did)
    if (!contChain) break

    const contItems = continuation
      .slice(contChain.start, contChain.end + 1)
      .map(item => ({...item, depth: item.depth + tip.depth}))
    const settledTip: RawThreadItem = {
      ...tip,
      value: {
        ...tipValue,
        moreReplies: Math.max(0, tipValue.moreReplies - 1),
      },
    }
    result = [
      ...result.slice(0, tipIndex),
      settledTip,
      ...contItems,
      ...result.slice(tipIndex + 1),
    ]
    tipIndex += contItems.length
    tipMaybeTruncated = !hasHydratedChild(continuation, contChain.end)
  }

  return result
}

/**
 * Whether the post at `index` has any hydrated child - an item directly
 * after it one level deeper. In a depth-first response a post's subtree
 * follows it immediately, so an absent or shallower next item means nothing
 * below this post was served.
 */
function hasHydratedChild(thread: RawThreadItem[], index: number): boolean {
  return thread[index + 1]?.depth === thread[index].depth + 1
}
