import {
  hashKey,
  type InfiniteData,
  notifyManager,
  type QueryClient,
  type QueryFilters,
  type QueryKey,
} from '@tanstack/react-query'

import {type FeedAPI} from '#/lib/api/feed/types'
import {type BoundaryPage, gapBelow, settleFeedData} from './post-feed-boundary'

/** Live feed state, kept outside serializable query data. */
export type PostFeedQueryEntry = {
  /**
   * Keyed by pages and continuation params so overlapping refresh and
   * pagination chains keep their own stateful APIs.
   */
  feedApis: WeakMap<object, FeedAPI>
  /**
   * Counts the fetches from the top of the query, whether a refresh or one
   * TanStack started itself (the first load, a refetch, an invalidation or a
   * reset). Only the latest may write, so a refresh that a newer top fetch
   * overtook never lands.
   */
  generation: number
  /**
   * The refreshes in flight. They settle together, with the outcome of the one
   * that writes, so every caller learns of the commit that served it.
   */
  refresh?: PendingRefresh
  /**
   * The gap fills in flight, keyed by the page each gap is below, so that
   * fills of the same gap that overlap share one fetch.
   */
  gapFills: Map<object, Promise<GapFillResult<object>>>
}

type PendingRefresh = {
  promise: Promise<object | undefined>
  resolve: (page: object | undefined) => void
  reject: (error: unknown) => void
}

const registries = new WeakMap<QueryClient, Map<string, PostFeedQueryEntry>>()

/**
 * The page each page was copied from, for a page a write replaced with a copy
 * of itself: settling stamps pages and carries boundaries onto them. A copy is
 * the same page to everything that holds on to one - an operation in flight,
 * the rows selected for it - so each client keeps a record of them. Keyed by
 * the page objects themselves, so it holds nothing past them.
 */
const derivations = new WeakMap<QueryClient, WeakMap<object, object>>()

/**
 * The page a page was first fetched as, following any copies made of it
 * since. Two pages with the same origin are the same page of the feed.
 */
export function postFeedPageOrigin(
  queryClient: QueryClient,
  page: object,
): object {
  const derived = derivations.get(queryClient)
  let origin = page
  for (let from = derived?.get(origin); from; from = derived?.get(origin)) {
    origin = from
  }
  return origin
}

function recordPageCopy(queryClient: QueryClient, copy: object, of: object) {
  let derived = derivations.get(queryClient)
  if (!derived) {
    derived = new WeakMap()
    derivations.set(queryClient, derived)
  }
  derived.set(copy, of)
}

function getEntries(queryClient: QueryClient) {
  let entries = registries.get(queryClient)
  if (!entries) {
    const created = new Map<string, PostFeedQueryEntry>()
    queryClient.getQueryCache().subscribe(event => {
      if (event.type === 'removed') {
        // Its restore, if it had one, is over, but stays recorded.
        settlePostFeedRestore(queryClient, event.query.queryHash)
        const entry = created.get(event.query.queryHash)
        if (entry) {
          // A refresh in flight can no longer write, so it settles now.
          supersedePostFeedRefresh(entry)
          created.delete(event.query.queryHash)
        }
      }
    })
    registries.set(queryClient, created)
    entries = created
  }
  return entries
}

export function getPostFeedQueryEntry(
  queryClient: QueryClient,
  queryKey: QueryKey,
): PostFeedQueryEntry {
  const queryHash = hashKey(queryKey)
  const entries = getEntries(queryClient)
  let entry = entries.get(queryHash)
  if (!entry) {
    entry = {feedApis: new WeakMap(), generation: 0, gapFills: new Map()}
    // An in-flight fetch must not recreate an entry after query removal.
    if (queryClient.getQueryCache().get(queryHash)) {
      entries.set(queryHash, entry)
    }
  }
  return entry
}

export function peekPostFeedQueryEntry(
  queryClient: QueryClient,
  queryKey: QueryKey,
): PostFeedQueryEntry | undefined {
  return registries.get(queryClient)?.get(hashKey(queryKey))
}

/**
 * Overtakes any refresh of this query that is in flight: those settle without
 * writing. Called for every fetch from the top that the refresh operation does
 * not own, so that the most recently started one is what lands.
 */
export function supersedePostFeedRefresh(entry: PostFeedQueryEntry) {
  entry.generation++
  entry.refresh?.resolve(undefined)
  entry.refresh = undefined
}

/**
 * {@link supersedePostFeedRefresh} for every cached post-feed query matching
 * `filters`, for changes that make any response still in flight stale.
 */
export function supersedePostFeedRefreshes(
  queryClient: QueryClient,
  filters: QueryFilters,
) {
  const entries = registries.get(queryClient)
  for (const query of queryClient.getQueryCache().findAll(filters)) {
    settlePostFeedRestore(queryClient, query.queryHash)
    const entry = entries?.get(query.queryHash)
    if (entry) {
      supersedePostFeedRefresh(entry)
    }
  }
}

/**
 * Whether a refresh of the post-feed query with this key is in flight.
 */
export function isPostFeedRefreshing(
  queryClient: QueryClient,
  queryKey: QueryKey,
) {
  return peekPostFeedQueryEntry(queryClient, queryKey)?.refresh !== undefined
}

/**
 * Replaces a post-feed query's pages with a freshly fetched top page in a
 * single write, or leaves them untouched.
 *
 * `fetchTop` fetches the page with a new API of its own, and nothing is written
 * until it has. The page, its page param and its API are then promoted
 * together, so the next page continues with that API. A failed fetch writes
 * nothing, and the cached pages carry on paginating with theirs.
 *
 * Refreshes that overlap share one outcome. Each starts its own fetch, as a
 * TanStack refetch would, but only the latest may write, and they all settle
 * with its result: the page it wrote, or its error. A fetch from the top that
 * TanStack starts, or the query's removal, settles them without a write.
 */
export function refreshPostFeedQuery<Page extends object>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  fetchTop: () => Promise<{page: Page; api: FeedAPI}>,
): Promise<Page | undefined> {
  const entry = getPostFeedQueryEntry(queryClient, queryKey)
  const generation = ++entry.generation
  const pending = (entry.refresh ??= createPendingRefresh())
  const isLatest = () => entry.generation === generation

  void (async () => {
    try {
      const {page, api} = await fetchTop()
      if (!isLatest()) {
        return
      }
      entry.refresh = undefined
      // Also false for an entry never cached, which nothing supersedes.
      if (peekPostFeedQueryEntry(queryClient, queryKey) !== entry) {
        pending.resolve(undefined)
        return
      }
      entry.feedApis.set(page, api)
      // What was restored is replaced, so there is nothing left to follow up.
      settlePostFeedRestore(queryClient, hashKey(queryKey))
      /*
       * A fetch still in flight, such as a fetchNextPage, would land after this
       * write and put back the pages it replaces, so it is cancelled first. In
       * one batch with the write, so observers hear of both once.
       */
      notifyManager.batch(() => {
        void queryClient.cancelQueries({queryKey, exact: true})
        queryClient.setQueryData<InfiniteData<Page, unknown>>(queryKey, {
          pages: [page],
          pageParams: [undefined],
        })
      })
      pending.resolve(page)
    } catch (error) {
      if (isLatest()) {
        entry.refresh = undefined
        pending.reject(error)
      }
    }
  })()

  /*
   * Callers wait on the shared outcome rather than their own fetch, so a
   * superseded refresh settles as soon as whatever overtook it does.
   */
  return pending.promise as Promise<Page | undefined>
}

function createPendingRefresh(): PendingRefresh {
  let resolve!: PendingRefresh['resolve']
  let reject!: PendingRefresh['reject']
  const promise = new Promise<object | undefined>((res, rej) => {
    resolve = res
    reject = rej
  })
  return {promise, resolve, reject}
}

/**
 * Whether TanStack is fetching a post-feed query from the top, or waiting to
 * (a refetch, an invalidation, a reset), as against fetching the next page.
 * What it fetches replaces the cached pages, so an operation that would write
 * around them gives way to it, and must not cancel it: that would swallow the
 * invalidation behind it.
 */
/** Whether two pages are the same page of the feed, or copies of it. */
function isSamePage(
  queryClient: QueryClient,
  a: object | undefined,
  b: object | undefined,
) {
  return (
    a !== undefined &&
    b !== undefined &&
    postFeedPageOrigin(queryClient, a) === postFeedPageOrigin(queryClient, b)
  )
}

/** Where `page`, or a copy of it, is among `pages`, or -1. */
function indexOfPage(
  queryClient: QueryClient,
  pages: readonly object[] | undefined,
  page: object,
) {
  if (!pages) {
    return -1
  }
  const index = pages.indexOf(page)
  return index !== -1
    ? index
    : pages.findIndex(candidate => isSamePage(queryClient, candidate, page))
}

function isFetchingFromTop(queryClient: QueryClient, queryKey: QueryKey) {
  const state = queryClient.getQueryCache().find({queryKey, exact: true})?.state
  return (
    state !== undefined &&
    state.fetchStatus !== 'idle' &&
    !state.fetchMeta?.fetchMore
  )
}

/**
 * Adds a page above a post-feed query's top page in a single write, or leaves
 * the query untouched.
 *
 * `fetchAbove` fetches the page, bounded by the top page it is handed, and
 * decides whether there is anything to add. Nothing is written until it has,
 * and then only if the top page is still the one it was bounded by: a refresh
 * or a fetch from the top that started meanwhile, or one still in flight,
 * replaces the top, and the query's removal ends it. One already in flight
 * when it starts means it does not fetch at all. The write only cancels a
 * fetchNextPage, never a fetch from the top. The page starts a chain
 * of its own (its page param is `undefined`), so a TanStack refetch from the
 * first page param is an ordinary fetch from the top, never a replay of the
 * bounded one.
 *
 * `beforeCommit` runs between the fetch and the write, and everything is
 * checked again after it. The commit-at-rest gate (D2) waits there for the list
 * to stop moving.
 *
 * Rejects when `fetchAbove` does, having written nothing.
 */
export async function prependPostFeedQuery<Page extends object, Detail>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  fetchAbove: (
    top: Page,
  ) => Promise<{page?: Page; api?: FeedAPI; detail: Detail}>,
  {beforeCommit}: {beforeCommit?: () => Promise<void>} = {},
): Promise<{
  status: 'committed' | 'nothing' | 'superseded'
  detail?: Detail
}> {
  const readTop = () =>
    queryClient.getQueryData<InfiniteData<Page, unknown>>(queryKey)?.pages[0]
  const top = readTop()
  if (!top) {
    return {status: 'superseded'}
  }
  const entry = getPostFeedQueryEntry(queryClient, queryKey)
  const generation = entry.generation
  const isCurrent = () =>
    entry.generation === generation &&
    entry.refresh === undefined &&
    !isFetchingFromTop(queryClient, queryKey) &&
    peekPostFeedQueryEntry(queryClient, queryKey) === entry &&
    isSamePage(queryClient, readTop(), top)
  if (!isCurrent()) {
    return {status: 'superseded'}
  }

  const {page, api, detail} = await fetchAbove(top)
  if (!isCurrent()) {
    return {status: 'superseded', detail}
  }
  if (!page) {
    return {status: 'nothing', detail}
  }
  await beforeCommit?.()
  if (!isCurrent()) {
    return {status: 'superseded', detail}
  }
  if (api) {
    entry.feedApis.set(page, api)
  }
  // As in `refreshPostFeedQuery`: nothing in flight may land after this.
  notifyManager.batch(() => {
    void queryClient.cancelQueries({queryKey, exact: true})
    queryClient.setQueryData<InfiniteData<Page, unknown>>(queryKey, data =>
      data && isSamePage(queryClient, data.pages[0], top)
        ? {
            pages: [page, ...data.pages],
            pageParams: [undefined, ...data.pageParams],
          }
        : data,
    )
  })
  return {status: 'committed', detail}
}

export type GapFillResult<Page> =
  {status: 'filled'; page: Page} | {status: 'superseded'}

/**
 * Fills the gap below `upper`, one of a post-feed query's pages, in a single
 * write: every page below it is replaced by the page that continues from its
 * cursor. Or leaves the query untouched.
 *
 * `fetchBelow` fetches that page, continuing the chain `upper` belongs to with
 * the API it is handed (`undefined` for a page without one, as one restored
 * from disk has). Nothing is written until it has: truncating first would
 * leave the list shorter than its scroll offset, which iOS clamps, so the
 * reader would jump. The page's API is promoted with it, so pagination carries
 * on from it.
 *
 * The write only lands if `upper` is still one of the pages with an open gap
 * below it (see {@link gapBelow}), and nothing has replaced the pages meanwhile: a refresh or a fetch from
 * the top that started, or is still in flight, supersedes it, and so does the
 * query's removal. One in flight when it starts means it does not fetch at
 * all. Pages added above meanwhile, as a prepend adds them, stay. A
 * fetchNextPage in flight is cancelled with the write, since it would put back
 * what the write replaces; a fetch from the top never is.
 *
 * `mayCommit` runs between the fetch and the write, and everything is checked
 * again after it. When it says no, the fill is superseded and nothing is
 * written: the view uses it to keep what the reader has scrolled on to.
 *
 * Fills of the same gap that overlap share one fetch and its outcome. Rejects
 * when `fetchBelow` does, having written nothing, so the gap can be filled
 * again.
 */
export function fillPostFeedGap<
  Page extends {cursor: string | undefined; since?: string},
>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  upper: Page,
  fetchBelow: (api: FeedAPI | undefined) => Promise<{page: Page; api: FeedAPI}>,
  {mayCommit}: {mayCommit?: () => Promise<boolean>} = {},
): Promise<GapFillResult<Page>> {
  const entry = getPostFeedQueryEntry(queryClient, queryKey)
  const inFlight = entry.gapFills.get(upper)
  if (inFlight) {
    return inFlight as Promise<GapFillResult<Page>>
  }

  const hasOpenGapBelow = () => {
    const data = queryClient.getQueryData<InfiniteData<Page, unknown>>(queryKey)
    const index = indexOfPage(queryClient, data?.pages, upper)
    return (
      index !== -1 &&
      index < data!.pages.length - 1 &&
      gapBelow(upper, data!.pageParams[index + 1]) === 'open'
    )
  }
  const generation = entry.generation
  const isCurrent = () =>
    entry.generation === generation &&
    entry.refresh === undefined &&
    !isFetchingFromTop(queryClient, queryKey) &&
    peekPostFeedQueryEntry(queryClient, queryKey) === entry &&
    hasOpenGapBelow()

  const fill = (async (): Promise<GapFillResult<Page>> => {
    const cursor = upper.cursor
    // Nothing to fill, or what is in flight is about to replace the pages.
    if (cursor === undefined || !isCurrent()) {
      return {status: 'superseded'}
    }
    const {page, api} = await fetchBelow(entry.feedApis.get(upper))
    if (!isCurrent() || (mayCommit && !(await mayCommit()))) {
      return {status: 'superseded'}
    }
    if (!isCurrent()) {
      return {status: 'superseded'}
    }
    // As `getNextPageParam` would have made it, had the page been fetched next.
    const pageParam = {cursor}
    entry.feedApis.set(page, api)
    entry.feedApis.set(pageParam, api)
    /*
     * As in `refreshPostFeedQuery`: nothing in flight may land after this.
     * That can only be a fetchNextPage, since a fetch from the top would have
     * superseded the fill.
     */
    notifyManager.batch(() => {
      void queryClient.cancelQueries({queryKey, exact: true})
      queryClient.setQueryData<InfiniteData<Page, unknown>>(queryKey, data => {
        const index = indexOfPage(queryClient, data?.pages, upper)
        if (!data || index === -1) {
          return data
        }
        return {
          pages: [...data.pages.slice(0, index + 1), page],
          pageParams: [...data.pageParams.slice(0, index + 1), pageParam],
        }
      })
    })
    return {status: 'filled', page}
  })()

  entry.gapFills.set(upper, fill)
  const settle = () => {
    if (entry.gapFills.get(upper) === fill) {
      entry.gapFills.delete(upper)
    }
  }
  fill.then(settle, settle)
  return fill
}

/**
 * Whether reaching the true top of a post-feed query would have anything to
 * settle - see `settleFeedData`.
 */
export function hasPostFeedSettlement(
  queryClient: QueryClient,
  queryKey: QueryKey,
) {
  const data =
    queryClient.getQueryData<
      InfiniteData<BoundaryPage & {reachedAt?: number}, unknown>
    >(queryKey)
  return data !== undefined && settleFeedData(data, 0) !== undefined
}

export type PostFeedSettleResult =
  | {status: 'settled'; reached: number; retired: number}
  | {status: 'nothing' | 'superseded'}

/**
 * Settles a post-feed query whose reader has reached its true top, in a single
 * write - see `settleFeedData` for what that marks and retires. For the view
 * to call once its list says it is at rest there; this cannot tell.
 *
 * Nothing is written while something is about to replace the pages: a
 * refresh or a fetch from the top in flight, or the follow-up of a restore
 * (which is about to add to the top, and whose own correction of the list is
 * no arrival). A fetchNextPage in flight is cancelled with the write, as it
 * would put back pages the write retires, and the marks with them.
 *
 * Pages the write replaces with a copy - to mark them, or to carry a boundary
 * onto them - are recorded as the same pages (see `postFeedPageOrigin`), with
 * the same API, so that the rows selected for them stay as they were and what
 * is in flight against them still lands.
 */
export function settlePostFeedQuery<
  Page extends BoundaryPage & {reachedAt?: number},
>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  now = Date.now(),
): PostFeedSettleResult {
  const data = queryClient.getQueryData<InfiniteData<Page, unknown>>(queryKey)
  if (
    !data ||
    isPostFeedRefreshing(queryClient, queryKey) ||
    isFetchingFromTop(queryClient, queryKey) ||
    isPostFeedRestorePending(queryClient, queryKey)
  ) {
    return {status: 'superseded'}
  }
  const settled = settleFeedData(data, now)
  if (!settled) {
    return {status: 'nothing'}
  }
  const entry = getPostFeedQueryEntry(queryClient, queryKey)
  settled.pages.forEach((page, index) => {
    const original = data.pages[index]
    if (page !== original) {
      recordPageCopy(queryClient, page, original)
      const api = entry.feedApis.get(original)
      if (api) {
        entry.feedApis.set(page, api)
      }
    }
  })
  notifyManager.batch(() => {
    void queryClient.cancelQueries({queryKey, exact: true})
    queryClient.setQueryData<InfiniteData<Page, unknown>>(queryKey, {
      pages: settled.pages,
      pageParams: settled.pageParams,
    })
  })
  return {status: 'settled', reached: settled.reached, retired: settled.retired}
}

/**
 * Gives the top page of a post-feed query an API if it has none, as a page
 * restored from disk does, so that the feed can be peeked at for new posts.
 */
export function ensurePostFeedTopApi(
  queryClient: QueryClient,
  queryKey: QueryKey,
  createApi: () => FeedAPI,
) {
  const top =
    queryClient.getQueryData<InfiniteData<object, unknown>>(queryKey)?.pages[0]
  const entry = peekPostFeedQueryEntry(queryClient, queryKey)
  if (top && entry && !entry.feedApis.has(top)) {
    entry.feedApis.set(top, createApi())
  }
}

/**
 * A post-feed query that was restored from disk this account session, and how
 * far its follow-up has got: the fetch of what is newer than the restored top
 * (the restore prepend).
 *
 * - `pending`: restored, and not followed up yet.
 * - `prepending`: the follow-up is in flight.
 * - `settled`: followed up, or overtaken by whatever replaced the restored top
 *   (a refresh, a fetch from the top, a reset, the query's removal).
 *
 * Unlike the entries above, these are not disposed with their query: the
 * restore happened once for the session, whatever becomes of the query later.
 * They go when the account's `QueryClient` does.
 */
export type PostFeedRestore = {
  restoredAt: number
  pageCount: number
  status: 'pending' | 'prepending' | 'settled'
}

const restores = new WeakMap<QueryClient, Map<string, PostFeedRestore>>()

/**
 * Records that the query with this hash was hydrated from a snapshot.
 */
export function recordPostFeedRestore(
  queryClient: QueryClient,
  queryHash: string,
  restore: Omit<PostFeedRestore, 'status'>,
) {
  // So that the query's removal settles it.
  getEntries(queryClient)
  let records = restores.get(queryClient)
  if (!records) {
    records = new Map()
    restores.set(queryClient, records)
  }
  records.set(queryHash, {...restore, status: 'pending'})
}

/**
 * The restore of the post-feed query with this key, if it was restored this
 * account session.
 */
export function getPostFeedRestore(
  queryClient: QueryClient,
  queryKey: QueryKey,
): PostFeedRestore | undefined {
  return restores.get(queryClient)?.get(hashKey(queryKey))
}

/**
 * Whether the post-feed query with this key was restored and its follow-up has
 * not finished, whether it has started or not. Checks and polls that would
 * measure the restored top hold back until it has.
 */
export function isPostFeedRestorePending(
  queryClient: QueryClient,
  queryKey: QueryKey,
) {
  const status = getPostFeedRestore(queryClient, queryKey)?.status
  return status === 'pending' || status === 'prepending'
}

/**
 * Claims the follow-up of the restore of the post-feed query with this key,
 * if it is still to be made. True for exactly one caller per account session.
 */
export function beginPostFeedRestorePrepend(
  queryClient: QueryClient,
  queryKey: QueryKey,
) {
  const restore = getPostFeedRestore(queryClient, queryKey)
  if (restore?.status !== 'pending') {
    return false
  }
  restore.status = 'prepending'
  return true
}

/**
 * Marks the restore of the query with this hash as followed up, if it had one.
 */
export function settlePostFeedRestore(
  queryClient: QueryClient,
  queryHash: string,
) {
  const restore = restores.get(queryClient)?.get(queryHash)
  if (restore) {
    restore.status = 'settled'
  }
}
