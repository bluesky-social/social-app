import {AtUri} from '@atproto/api'

import {makeProfileLink} from '#/lib/routes/links'
import {type ThreadItem} from '#/state/queries/usePostThread/types'

export type ThreadPostItem = Extract<ThreadItem, {type: 'threadPost'}>

/**
 * A toggle rendered after a post, inside its bracket. Expanding it reveals the
 * post's actions and replies, so the post bodies themselves stay plain,
 * selectable text.
 */
export type ReaderSeam = {
  expanded: boolean
  /**
   * Number of replies to this post that are not hydrated in the linear
   * response and are therefore not rendered anywhere on this screen.
   */
  hiddenReplyCount: number
  /**
   * URI of the next post in the OP chain, which renders as its own segment.
   * Excluded from the seam's fetched replies.
   */
  continuationUri: string
  href: string
}

export type ReaderSegmentItem = {
  type: 'readerSegment'
  key: string
  uri: string
  depth: number
  item: ThreadPostItem
  /** The seam rendered after this post, within its bracket. */
  seam: ReaderSeam
}

export type ReaderItem = ThreadItem | ReaderSegmentItem

/**
 * Transforms linear thread items into the reader view: the anchor post plus
 * the OP's contiguous self-thread collapse into continuous "segments" of plain
 * text, with a "seam" toggle after each post that reveals its actions and
 * replies, so a multi-part thread reads as one post.
 *
 * Items before the anchor (parents) pass through unchanged. If no OP chain is
 * found, the input is returned as-is.
 */
export function buildReaderThread(
  items: ThreadItem[],
  {expandedSeamUri}: {expandedSeamUri: string | null},
): {
  items: ReaderItem[]
  /** The anchor's seam, rendered inside the anchor post. */
  anchorSeam?: ReaderSeam
  /** The open seam, if any. Resolved here to spare consumers a scan. */
  expandedSeam?: ReaderSeam
} {
  const noChain = {
    items: items as ReaderItem[],
    anchorSeam: undefined as ReaderSeam | undefined,
    expandedSeam: undefined as ReaderSeam | undefined,
  }

  const anchorIndex = items.findIndex(
    item => item.type === 'threadPost' && item.depth === 0,
  )
  if (anchorIndex === -1) return noChain

  const anchor = items[anchorIndex] as ThreadPostItem
  const anchorDid = anchor.value.post.author.did

  /*
   * Locate the start of the OP self-thread chain: a depth-1 reply by the
   * anchor author marked `opThread` by the appview. The appview usually
   * serves it directly below the anchor, but depending on sort it may not be
   * the first sibling, so scan all hydrated depth-1 replies.
   */
  const chainStart = items.findIndex(
    (item, i) =>
      i > anchorIndex &&
      item.type === 'threadPost' &&
      item.depth === 1 &&
      item.value.opThread &&
      item.value.post.author.did === anchorDid,
  )
  if (chainStart === -1) return noChain

  /*
   * Collect the contiguous chain. Branches are served depth-first, one post
   * per level in linear view, so the chain is a contiguous run of items each
   * one level deeper than the last. Anything else - a tombstone, a read more
   * link, a reply by someone else - ends the chain, and we collapse only the
   * clean prefix.
   */
  const chain: ThreadPostItem[] = [items[chainStart] as ThreadPostItem]
  let chainEnd = chainStart
  for (let i = chainStart + 1; i < items.length; i++) {
    const item = items[i]
    const prev = chain[chain.length - 1]
    if (
      item.type === 'threadPost' &&
      item.depth === prev.depth + 1 &&
      item.value.opThread &&
      item.value.post.author.did === anchorDid
    ) {
      chain.push(item)
      chainEnd = i
    } else {
      break
    }
  }

  /*
   * A "read more" immediately following the chain belongs to the chain's
   * branch (sibling branches always start with a depth-1 post), so it moves
   * with the chain and renders after the last segment.
   */
  let chainReadMore: ThreadItem | undefined
  const afterChain = items[chainEnd + 1]
  if (afterChain?.type === 'readMore') {
    chainReadMore = afterChain
    chainEnd++
  }

  const result: ReaderItem[] = items.slice(0, anchorIndex + 1)

  let expandedSeam: ReaderSeam | undefined

  /*
   * The anchor's seam uses the full replyCount: every direct reply other than
   * the chain start is dropped from the read and reachable only here.
   */
  const anchorSeam = createSeam(anchor, {
    expandedSeamUri,
    continuationUri: chain[0].uri,
    fullCount: true,
  })
  if (anchorSeam.expanded) expandedSeam = anchorSeam

  for (let i = 0; i < chain.length; i++) {
    const post = chain[i]
    const continuation = chain[i + 1]
    const seam = createSeam(post, {
      expandedSeamUri,
      continuationUri: continuation?.uri ?? '',
      fullCount: !continuation,
    })
    if (seam.expanded) expandedSeam = seam
    result.push({
      type: 'readerSegment',
      key: `readerSegment:${post.uri}`,
      uri: post.uri,
      depth: post.depth,
      item: post,
      seam,
    })
  }

  if (chainReadMore) {
    result.push(chainReadMore)
  }

  return {items: result, anchorSeam, expandedSeam}
}

export type ThreadPostPosition = {
  /** 1-based position in the self-thread, where its first post is 1. */
  position: number
  /** Number of posts in the self-thread. */
  postCount: number
}

/**
 * Maps each post of a self-thread - a run of consecutive replies by one
 * author, i.e. the OP thread from the root or a multi-part reply - to its
 * "(x/n)" position for the linear view's indicator chips.
 *
 * Chains are only numbered when the numbers can be trusted:
 *
 * - The start must be verifiably the chain's first post: the thread root, or
 *   a reply whose parent is hydrated and by another author. Same-author
 *   forks and posts with unhydrated parents are skipped since their true
 *   position is unknowable.
 * - The OP chain is fetched exhaustively (see `extendSelfThreadChain`), so it is
 *   always complete. Other chains are cut off by the fetch depth cap, which
 *   surfaces as a "read more" after the last post - skip those rather than
 *   show a wrong total.
 */
export function computeSelfThreadPositions(
  items: ThreadItem[],
): Map<string, ThreadPostPosition> | undefined {
  const positions = new Map<string, ThreadPostPosition>()
  const claimed = new Set<string>()

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (item.type !== 'threadPost' || claimed.has(item.uri)) continue
    if (!isValidChainStart(items, i)) continue

    const {chain, tipIndex} = collectChain(items, i)
    for (const post of chain) claimed.add(post.uri)
    if (chain.length < 2) continue

    const tip = chain[chain.length - 1]
    if (!tip.value.opThread && isCutOffByDepthCap(items, tipIndex)) continue

    for (let k = 0; k < chain.length; k++) {
      positions.set(chain[k].uri, {
        position: k + 1,
        postCount: chain.length,
      })
    }
  }

  return positions.size ? positions : undefined
}

/**
 * A chain start is trustworthy when it is the thread root, or a reply whose
 * parent - the nearest preceding item one level up - is hydrated and by
 * another author. A hydrated same-author parent means this post is a fork
 * off a chain that was numbered (or skipped) already.
 */
function isValidChainStart(items: ThreadItem[], index: number): boolean {
  const item = items[index] as ThreadPostItem
  if (!item.value.post.record.reply) return true
  const did = item.value.post.author.did
  for (let j = index - 1; j >= 0; j--) {
    const prev = items[j]
    if (prev.type === 'replyComposer') continue
    if (!('depth' in prev)) return false
    if (prev.depth < item.depth) {
      return (
        prev.depth === item.depth - 1 &&
        prev.type === 'threadPost' &&
        prev.value.post.author.did !== did
      )
    }
  }
  return false
}

/**
 * Collects the self-thread starting at `startIndex`: repeatedly finds the
 * next same-author child. Children are scanned across the parent's whole
 * subtree, not just the adjacent item, since the anchor's direct replies are
 * all hydrated and the continuation may sort after other replies.
 */
function collectChain(
  items: ThreadItem[],
  startIndex: number,
): {chain: ThreadPostItem[]; tipIndex: number} {
  const start = items[startIndex] as ThreadPostItem
  const did = start.value.post.author.did
  const chain = [start]
  let tipIndex = startIndex

  let next = findChainChild(items, tipIndex, did)
  while (next !== -1) {
    chain.push(items[next] as ThreadPostItem)
    tipIndex = next
    next = findChainChild(items, tipIndex, did)
  }
  return {chain, tipIndex}
}

function findChainChild(
  items: ThreadItem[],
  parentIndex: number,
  did: string,
): number {
  const parent = items[parentIndex] as ThreadPostItem
  for (let j = parentIndex + 1; j < items.length; j++) {
    const item = items[j]
    if (item.type === 'replyComposer') continue
    if (!('depth' in item) || item.depth <= parent.depth) break
    if (
      item.depth === parent.depth + 1 &&
      item.type === 'threadPost' &&
      item.value.post.author.did === did
    ) {
      return j
    }
  }
  return -1
}

/**
 * A "read more" immediately after a chain's last post means that post sits
 * at the fetch depth cap with nothing of its subtree hydrated - the chain
 * may well continue behind it.
 */
function isCutOffByDepthCap(items: ThreadItem[], tipIndex: number): boolean {
  for (let j = tipIndex + 1; j < items.length; j++) {
    const item = items[j]
    if (item.type === 'replyComposer') continue
    return item.type === 'readMore'
  }
  return false
}

function createSeam(
  post: ThreadPostItem,
  {
    expandedSeamUri,
    continuationUri,
    fullCount,
  }: {
    expandedSeamUri: string | null
    continuationUri: string
    fullCount: boolean
  },
): ReaderSeam {
  const urip = new AtUri(post.uri)
  /*
   * Mid-chain seams have a continuation, so use moreReplies (replies not
   * already in the response). The anchor and the last post use the full
   * replyCount, since none of their replies render below them.
   *
   * moreReplies is exact only because reader view fetches with branchingFactor
   * 1 (READER_VIEW_BELOW); a higher factor would undercount here.
   */
  const hiddenReplyCount = fullCount
    ? (post.value.post.replyCount ?? 0)
    : post.value.moreReplies || 0
  return {
    expanded: expandedSeamUri === post.uri,
    hiddenReplyCount,
    continuationUri,
    href: makeProfileLink(post.value.post.author, 'post', urip.rkey),
  }
}
