/**
 * Pure ranking helper for the weekly recap top-post selection (AC-B2).
 *
 * Sort by `likeCount + repostCount + replyCount` descending; tiebreaker
 * newer wins (Q3 default). Input is an array of opaque "candidate"
 * objects with engagement fields + indexedAt — we return a ranked copy.
 */

export type TopPostCandidate = {
  uri: string
  cid: string
  /** Millisecond epoch. Typically `new Date(post.indexedAt).getTime()`. */
  indexedAtMs: number
  likeCount: number
  repostCount: number
  replyCount: number
}

/**
 * Return candidates sorted by engagement desc with newer-wins tiebreaker.
 * The return is a new array; the input is not mutated.
 */
export function rankTopPost(
  candidates: readonly TopPostCandidate[],
): TopPostCandidate[] {
  const score = (c: TopPostCandidate) =>
    (c.likeCount ?? 0) + (c.repostCount ?? 0) + (c.replyCount ?? 0)
  return [...candidates].sort((a, b) => {
    const sb = score(b)
    const sa = score(a)
    if (sb !== sa) return sb - sa
    return (b.indexedAtMs ?? 0) - (a.indexedAtMs ?? 0)
  })
}
