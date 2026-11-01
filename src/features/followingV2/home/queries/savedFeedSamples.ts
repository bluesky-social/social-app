import {useEffect} from 'react'
import {type Client} from '@atproto/lex'
import {type AtUriString} from '@atproto/syntax'
import {useInfiniteQuery} from '@tanstack/react-query'

import {aggregateUserInterests} from '#/lib/api/feed/utils'
import {FeedTuner} from '#/lib/api/feed-manip'
import {feedUriToHref} from '#/lib/strings/url-helpers'
import {useFeedTuners} from '#/state/preferences/feed-tuners'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {STALE} from '#/state/queries'
import {RQKEY_ROOT} from '#/state/queries/post-feed'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {useAppviewClient} from '#/state/session'
import {CustomFeedAPI} from '#/features/followingV2/home/api/custom'
import {type ReasonFeedSource} from '#/features/followingV2/home/api/types'
import {pagesInSampleOrder} from '#/features/followingV2/home/mixSamples'
import {
  type FeedPage,
  type FeedPostSlice,
  toFeedPostSlice,
} from '#/features/followingV2/home/queries/postFeed'
import {type app} from '#/lexicons'

/** How many saved feeds each page of samples reads. */
const FEEDS_PER_PAGE = 3
/** How many posts each page reads from each feed. */
const POSTS_PER_FEED = 10
/** Samples older than this are left out. */
const MAX_AGE_MS = 24 * 60 * 60e3

type PageParam = {
  /**
   * Where each feed continues from: missing until it's first read, `null` once
   * it has run out or failed.
   */
  cursors: Record<string, string | null>
  /**
   * Where in the saved feeds the page starts reading. The first page picks a
   * random start, so a refresh starts on different feeds.
   */
  offset?: number
}

/** A post from a saved feed, with the feed it came from as its reason. */
type Sample = app.bsky.feed.defs.FeedViewPost & {__source: ReasonFeedSource}

type SamplesPage = Required<PageParam> & {
  /**
   * The page's samples, alternating between the feeds they came from. It's
   * called `feed`, like a post feed page's, so the cache-wide helpers that walk
   * the post feed root (post shadows, the thread cache) reach these posts too.
   */
  feed: Sample[]
}

export function RQKEY({
  feeds,
  generation,
}: {
  feeds: string[]
  generation: number | undefined
}) {
  return [RQKEY_ROOT, 'v2|samples', {feeds, generation}]
}

/**
 * Samples of the user's saved feeds, for the "Show samples of your saved feeds
 * in your Following feed" lab setting, in batches for `mixSamples`. It's
 * a query of its own, so Following is the same with the setting on or off.
 *
 * There's a batch per page of Following, plus one ahead, so a new page usually
 * has its samples when it lands. The query starts again when Following does:
 * its `generation` is when Following's first page was fetched, which a refresh
 * changes and a page added at either end doesn't.
 *
 * Like Merge, it needs at least two saved feeds, and only samples from a page
 * when two or more of the feeds it read have recent posts.
 */
export function useSavedFeedSamples({
  enabled,
  pages,
}: {
  enabled: boolean
  pages: FeedPage[] | undefined
}): FeedPostSlice[][] | undefined {
  const {data: preferences} = usePreferencesQuery()
  const moderationOpts = useModerationOpts()
  const feedTuners = useFeedTuners('following')
  const client = useAppviewClient()
  const userInterests = aggregateUserInterests(preferences)
  const feeds = preferences?.feedViewPrefs.lab_mergeFeedEnabled
    ? preferences.savedFeeds.filter(f => f.type === 'feed').map(f => f.value)
    : []
  const sampled = pages ? pagesInSampleOrder(pages) : []
  const generation = sampled[0]?.fetchedAt
  const isOn = feeds.length >= 2
  const isEnabled =
    enabled && isOn && generation !== undefined && moderationOpts !== undefined

  const {data, hasNextPage, isFetchingNextPage, fetchNextPage} =
    useInfiniteQuery({
      enabled: isEnabled,
      staleTime: STALE.INFINITY,
      queryKey: RQKEY({feeds, generation}),
      queryFn: ({pageParam}) =>
        fetchSamples({client, feeds, userInterests, pageParam}),
      initialPageParam: {cursors: {}},
      getNextPageParam: (page: SamplesPage): PageParam | undefined =>
        feeds.some(feed => page.cursors[feed] !== null)
          ? {cursors: page.cursors, offset: page.offset}
          : undefined,
      select: ({pages}) => {
        const tuner = new FeedTuner(feedTuners)
        return pages.map(page =>
          tuner
            .tune(page.feed)
            .map(slice =>
              toFeedPostSlice(slice, {moderationOpts: moderationOpts!}),
            )
            .filter(slice => !!slice)
            .map(keySample),
        )
      },
    })

  const wanted = sampled.length + 1
  useEffect(() => {
    if (
      isEnabled &&
      data &&
      data.length < wanted &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      void fetchNextPage()
    }
  }, [isEnabled, data, wanted, hasNextPage, isFetchingNextPage, fetchNextPage])

  /*
   * Only fetching waits on `enabled`. Samples already fetched stay mixed in
   * while the feed is in the background, so its rows don't change under the
   * reader's scroll position.
   */
  return isOn ? data : undefined
}

/**
 * Prefixes a sample's keys, so they never clash with Following's own row for
 * the same post.
 */
function keySample(slice: FeedPostSlice): FeedPostSlice {
  return {
    ...slice,
    _reactKey: `sample|${slice._reactKey}`,
    items: slice.items.map(item => ({
      ...item,
      _reactKey: `sample|${item._reactKey}`,
    })),
  }
}

async function fetchSamples({
  client,
  feeds,
  userInterests,
  pageParam,
}: {
  client: Client
  feeds: string[]
  userInterests: string
  pageParam: PageParam
}): Promise<SamplesPage> {
  const {cursors} = pageParam
  const offset = pageParam.offset ?? Math.floor(Math.random() * feeds.length)
  const read = new Set<string>()
  for (let i = 0; i < Math.min(FEEDS_PER_PAGE, feeds.length); i++) {
    const feed = feeds[(offset + i) % feeds.length]
    if (cursors[feed] !== null) {
      read.add(feed)
    }
  }

  const minIndexedAt = Date.now() - MAX_AGE_MS
  const results = await Promise.all(
    [...read].map(async feed => {
      const cursor = cursors[feed] ?? undefined
      try {
        const api = new CustomFeedAPI({
          client,
          feedParams: {feed: feed as AtUriString},
          userInterests,
        })
        const res = await api.fetch({cursor, limit: POSTS_PER_FEED})
        const source: ReasonFeedSource = {
          $type: 'reasonFeedSource',
          uri: feed,
          href: feedUriToHref(feed),
        }
        return {
          feed,
          // A feed that repeats its cursor has run out.
          cursor: res.cursor && res.cursor !== cursor ? res.cursor : null,
          samples: res.feed
            .filter(
              item => new Date(item.post.indexedAt).getTime() > minIndexedAt,
            )
            .map(item => ({...item, __source: source})),
        }
      } catch {
        // Like Merge, leave a failing feed out rather than failing Following.
        return {feed, cursor: null, samples: []}
      }
    }),
  )

  const withSamples = results.filter(result => result.samples.length)
  return {
    cursors: {
      ...cursors,
      ...Object.fromEntries(
        results.map(result => [result.feed, result.cursor]),
      ),
    },
    offset: (offset + FEEDS_PER_PAGE) % feeds.length,
    feed:
      withSamples.length >= 2
        ? alternate(withSamples.map(result => result.samples))
        : [],
  }
}

/** Takes one from each list in turn. */
function alternate<T>(lists: T[][]): T[] {
  const out: T[] = []
  const longest = Math.max(...lists.map(list => list.length))
  for (let i = 0; i < longest; i++) {
    for (const list of lists) {
      if (i < list.length) {
        out.push(list[i])
      }
    }
  }
  return out
}
