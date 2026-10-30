/*
 * Links in the widget carry these params so the app can log a
 * `trendingTopic:click` (topics) or `trendingWidget:explore:click` (everything
 * else, which opens Explore) when it opens from one. They are stripped again
 * before the link is routed. The widget layouts can't import this file, so
 * their Explore URL is written out by hand.
 */
const REF_SRC = 'widget'
const PARAMS = {
  src: 'ref_src',
  rank: 'ref_rank',
  recId: 'ref_rec_id',
  size: 'ref_size',
}

/**
 * Builds the URL the widget opens for a trending topic.
 */
export function createWidgetTopicUrl(
  link: string,
  {rank, recId}: {rank: number; recId?: string},
): string {
  const url = new URL(link, 'https://bsky.app')
  url.searchParams.set(PARAMS.src, REF_SRC)
  url.searchParams.set(PARAMS.rank, String(rank))
  if (recId) {
    url.searchParams.set(PARAMS.recId, recId)
  }
  return url.toString()
}

/**
 * Returns the topic's path, rank, and recommendation ID if the URL was opened
 * from a topic in the widget.
 */
export function parseWidgetTopicClick(
  url: URL,
): {path: string; rank: number; recId?: string} | undefined {
  if (url.searchParams.get(PARAMS.src) !== REF_SRC) return
  const rank = Number(url.searchParams.get(PARAMS.rank))
  if (!Number.isInteger(rank) || rank < 1) return
  return {
    path: url.pathname,
    rank,
    recId: url.searchParams.get(PARAMS.recId) ?? undefined,
  }
}

/**
 * Returns the widget size if the URL was opened from the widget's Explore link
 * (anything but a topic). Only iOS reports a size.
 */
export function parseWidgetExploreClick(url: URL): {size?: string} | undefined {
  if (url.searchParams.get(PARAMS.src) !== REF_SRC) return
  if (url.searchParams.has(PARAMS.rank)) return
  return {size: url.searchParams.get(PARAMS.size) ?? undefined}
}

/**
 * Removes the widget's params from a path (with or without a leading slash).
 * Other paths are returned unchanged.
 */
export function stripWidgetTopicParams(path: string): string {
  const queryStart = path.indexOf('?')
  if (queryStart === -1) return path
  const params = new URLSearchParams(path.slice(queryStart + 1))
  if (params.get(PARAMS.src) !== REF_SRC) return path
  for (const param of Object.values(PARAMS)) {
    params.delete(param)
  }
  const query = params.toString()
  return path.slice(0, queryStart) + (query ? `?${query}` : '')
}
