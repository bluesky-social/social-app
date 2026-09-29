import {useEffect, useMemo} from 'react'
import {
  hashKey,
  type Query,
  type QueryClient,
  type QueryKey,
  useQueryClient,
} from '@tanstack/react-query'

import {type AppReturn, useOnAppReturnedFromBackground} from '#/lib/appState'
import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {isNetworkError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {STALE} from '#/state/queries'
import {
  getPostFeedQueryEntry,
  peekPostFeedQueryEntry,
  type PostFeedQueryEntry,
} from './post-feed-registry'

/*
 * When a post feed may check for new content above what it has loaded.
 *
 * Checks belong to the exact query, not to the view showing it: every view of
 * a query shares its check clock, its check in flight, the real return it owes
 * and what its checks found, all kept on the query's registry entry, so they
 * belong to the account's QueryClient and go with the query when it is
 * removed. What a view owns is whether it is active, the claim it holds on a
 * return's offer and whether it has been offered the query's finding since it
 * last became active.
 *
 * - Check clock: the later of the committed top page's fetch time and the
 *   latest successful check of that page. A check that finds nothing moves it;
 *   one that fails does not.
 * - Focus: a view becoming active checks only once the clock is at least
 *   FOCUS_CHECK_AFTER old. An empty feed, one with no items in any of its
 *   cached pages, skips that gate but not coalescing: its arrival is still
 *   answered by any check or fetch from the top that succeeds after it, such
 *   as the work it waited for, so a cold load that comes back empty is not
 *   followed by a check of its own. A feed whose items the surface filters
 *   out, such as by moderation, is not empty here and keeps the gate, since
 *   what counts is the cached response every view of the query shares, not
 *   what one of them renders.
 * - Return: a real return from the background is recorded on the query of each
 *   active view as soon as it happens, and stays owed for
 *   RETURN_INTENT_LIFETIME until a check or fetch from the top that settles
 *   after it answers it. When it can be handled, it checks only if the clock
 *   is at least RETURN_STALE_AFTER old, time away included, and is otherwise
 *   consumed without one; the focus gate does not apply to it. The active view
 *   claims it; a view that goes inactive first hands the claim back, expiry
 *   unchanged, and whatever the check found waits for the next active view of
 *   the query. It is consumed when a view is handed the finding, not when a
 *   request starts.
 * - Findings: what a focus or interval check hands its own trigger is kept on
 *   the query, with the committed top page it was measured against, and every
 *   active view of the query is offered it with no request of its own: the
 *   views active when it lands, and each view that becomes active later, every
 *   time it does, until that page is replaced or the query is removed. It keeps
 *   its trigger, so it never becomes a return, and it answers a pending focus,
 *   which a check would only find again. What goes to a return is the return's
 *   alone, and a finding does not answer a return, which still checks when it
 *   is due one.
 * - Coalescing: one check per query at a time, and none while work on its top
 *   is in flight or pending. Triggers that arrive meanwhile wait, and the clock
 *   that work moves decides whether they still need a check.
 * - Only an active view checks. Hidden and prefetched views never do, and never
 *   hear what a check found.
 */

/**
 * How old an exact query's check clock must be before a view of it becoming
 * active is worth a check. An empty feed does not wait for it.
 *
 * Provisional: the one-minute gate is to be validated in native use and
 * request-rate testing (APP-3159).
 */
export const FOCUS_CHECK_AFTER = STALE.MINUTES.ONE

/**
 * How old an exact query's check clock must be for a real return to be worth
 * a check. The clock runs from the committed top's fetch or last successful
 * check, so its age includes the time spent away.
 *
 * `onAppReturnedFromBackground` decides whether the reader really left; this
 * decides whether this query is worth checking now that they are back. A pull
 * to refresh, 45 seconds away and back again needs no check, so a return to
 * data fresher than this is consumed without one.
 *
 * Provisional: to be validated in native use and request-rate testing
 * (APP-3159).
 */
export const RETURN_STALE_AFTER = 2 * STALE.MINUTES.ONE

/**
 * How long a real return stays owed while focus, loading or another operation
 * keeps it from being handled.
 */
export const RETURN_INTENT_LIFETIME = STALE.MINUTES.FIVE

/**
 * What asked for a check.
 *
 * - `return`: a real return from the background (see
 *   `onAppReturnedFromBackground`) found the view active
 * - `focus`: the view became active - the reader arrived at it
 * - `interval`: the surface asked, through `requestCheck`
 */
export type PostFeedCheckTrigger = 'return' | 'focus' | 'interval'

export type PostFeedCheckContext = {
  /**
   * Why this check runs. A return outranks a focus it coincides with, so a
   * check both asked for runs once, as `return`.
   */
  trigger: PostFeedCheckTrigger
  /**
   * Whether what the check finds still applies: the query is still cached, no
   * fetch from its top has started since, and its committed top page is the
   * one the check started from. Check it after every await, before writing
   * anything. The coordinator checks it again once the check settles.
   */
  isCurrent: () => boolean
}

/**
 * An exact post-feed query's check state, kept on its registry entry.
 */
export type PostFeedCheckState = {
  /**
   * When each top page was last successfully checked, keyed by the page object
   * like the registry's `feedApis`. Only the committed top's entry counts
   * towards the check clock, so once the top is replaced the new page's own
   * fetch time is what counts, and the old page is not kept alive.
   */
  checkedAt: WeakMap<object, number>
  /**
   * The check a view of the query has in flight. It only holds other checks
   * off while it is current, so one that never settles cannot block the query
   * past the next replacement of its top.
   */
  pendingCheck?: {isCurrent: () => boolean}
  /** The latest real return the query still owes a check or an offer. */
  returnIntent?: ReturnIntent
  /**
   * What the latest positive focus or interval check found, for every active
   * view of the query to be offered. A newer one replaces it.
   */
  finding?: SharedFinding
}

type SharedFinding = {
  result: unknown
  /**
   * The committed top page it was found above. It goes stale, and is dropped,
   * once that page is replaced.
   */
  top: object
  /** What asked for the check that found it, which the offer keeps. */
  trigger: Exclude<PostFeedCheckTrigger, 'return'>
}

type ReturnIntent = {
  /** The return's id, so that views hearing the same return record it once. */
  id: number
  /** When the return happened, which a later check or fetch must postdate. */
  returnedAt: number
  /** Set when the return is recorded. Passing the claim on never extends it. */
  expiresAt: number
  /** The active view with the right to be handed what the check finds. */
  claimant?: PostFeedCheckView
  /**
   * What a check found for this return that no view has been handed yet, and
   * the committed top page it was found above. It goes stale if that page is
   * replaced.
   */
  finding?: {result: unknown; top: object}
}

type TopPage = {fetchedAt?: unknown}

/**
 * Lets the active view of a post feed check for new content when the rules
 * above say so: when the reader arrives at it, after a real return from the
 * background, and when the surface asks. The check itself is the surface's.
 *
 * ```tsx
 * const {requestCheck} = usePostFeedCheckTriggers({
 *   queryKey: RQKEY(feed, feedParams),
 *   isActive: isScreenFocused && isPageFocused && !isComposerOpen,
 *   check: async () =>
 *     (await pollLatest(queryClient, queryKey, page)) || undefined,
 *   onFound: (_found, trigger) => {
 *     setHasNew(true)
 *     if (trigger === 'return') setShowPill(true)
 *   },
 * })
 * ```
 *
 * Call it after the query's own hook in the same component, so that a fetch
 * the query starts on mount is already in flight when this looks.
 */
export function usePostFeedCheckTriggers<Result>({
  queryKey,
  isActive,
  isTopWorkPending = false,
  check,
  onFound,
}: {
  /** The exact post-feed query this view shows. */
  queryKey: QueryKey
  /**
   * Whether this view is the one the reader is looking at: its screen is
   * focused, and it is the selected pager tab if it is in one. A prefetched or
   * hidden view is not. Nor is one covered by something that the app opened
   * itself, such as the composer - on Android, coming back from an activity
   * the app started (a photo picker, the share sheet) is a real return, and
   * the view under the composer is not what the reader returned to.
   *
   * Only an active view checks, has a real return recorded for it, or is
   * handed what a check found.
   */
  isActive: boolean
  /**
   * Whether work that is about to replace or prepend to this query's top has
   * yet to show up as a fetch, such as a Following cold restore waiting for its
   * list to settle. Checks and owed returns wait until it clears, so they
   * cannot race it for the same range; returns are still recorded meanwhile.
   * Keep it set until that work's own fetch or check is in flight or done, and
   * report a check it made with {@link markPostFeedQueryChecked}.
   */
  isTopWorkPending?: boolean
  /**
   * Checks for new content above the committed top: resolves with what it
   * found, or `undefined` if there is nothing new, and rejects if it could not
   * tell. Finding nothing moves the check clock; failing does not, and the
   * failure is logged unless it is a network error.
   */
  check: (context: PostFeedCheckContext) => Promise<Result | undefined>
  /**
   * Hands this view what a check found. Only called while the view is active,
   * and only for the committed top the check measured. Being called is the
   * presentation as far as the coordinator is concerned: a return is consumed
   * here, and whatever the view does next, such as scrolling, is its own.
   *
   * What a focus or interval check found is also handed to the query's other
   * active views, with the trigger that found it, and to each view that
   * becomes active while the top it was measured against is still committed.
   * A view is handed it again every time it becomes active, since what it
   * showed for it may have been reset meanwhile, so being handed the same
   * finding twice has to be harmless.
   */
  onFound: (result: Result, trigger: PostFeedCheckTrigger) => void
}) {
  const queryClient = useQueryClient()
  const queryHash = hashKey(queryKey)
  const latestCheck = useNonReactiveCallback(check)
  const latestOnFound = useNonReactiveCallback(onFound)
  // One registration per client and exact query, keying the effects below.
  const view = useMemo(
    () =>
      new PostFeedCheckView(
        queryClient,
        queryHash,
        latestCheck,
        latestOnFound as (
          result: unknown,
          trigger: PostFeedCheckTrigger,
        ) => void,
      ),
    [queryClient, queryHash, latestCheck, latestOnFound],
  )

  useEffect(() => {
    view.connect()
    return () => view.disconnect()
  }, [view])

  useEffect(() => {
    view.update({isActive, isTopWorkPending})
  }, [view, isActive, isTopWorkPending])

  useOnAppReturnedFromBackground(appReturn => view.recordReturn(appReturn))

  return {
    /**
     * Checks now if this view is active, nothing else is working on the top,
     * and the query has a committed top, as for the surface's own interval. It
     * does not wait and is not gated by the check clock. An owed return goes
     * first.
     */
    requestCheck: () => view.requestCheck(),
  }
}

/**
 * Moves an exact query's check clock for work that checked its committed top
 * outside {@link usePostFeedCheckTriggers}, such as a cold restore whose
 * `since` fetch found nothing to prepend. Call it once that work has succeeded
 * and revalidated. Work that commits a new top page needs no call, since that
 * page's fetch time already counts.
 */
export function markPostFeedQueryChecked(
  queryClient: QueryClient,
  queryKey: QueryKey,
) {
  const query = queryClient.getQueryCache().get(hashKey(queryKey))
  const top = getTopPage(query)
  if (!query || !top) {
    return
  }
  const entry = getPostFeedQueryEntry(queryClient, query.queryKey)
  getCheckState(entry).checkedAt.set(top, Date.now())
  notifyViews(queryClient, query.queryHash)
}

/**
 * One mounted view of a query, as registered by
 * {@link usePostFeedCheckTriggers}.
 */
class PostFeedCheckView {
  private isActive = false
  private isTopWorkPending = false
  /** Whether the arrival that made this view active has yet to be looked at. */
  private isFocusPending = false
  /** When this view last became active. */
  private activatedAt = -Infinity
  private isIntervalDue = false
  /**
   * The return whose check failed during this view's current activation, so
   * that it is not retried until something new happens: another activation,
   * another return, or a `requestCheck`.
   */
  private attemptedReturnId: number | undefined
  /**
   * The query's finding this view has been offered during its current
   * activation.
   */
  private offeredFinding: SharedFinding | undefined
  private isEvaluating = false
  private shouldReevaluate = false

  constructor(
    private readonly queryClient: QueryClient,
    private readonly queryHash: string,
    private readonly check: (context: PostFeedCheckContext) => Promise<unknown>,
    private readonly onFound: (
      result: unknown,
      trigger: PostFeedCheckTrigger,
    ) => void,
  ) {}

  connect() {
    const views = getViews(this.queryClient)
    let viewsOfQuery = views.get(this.queryHash)
    if (!viewsOfQuery) {
      viewsOfQuery = new Set()
      views.set(this.queryHash, viewsOfQuery)
    }
    viewsOfQuery.add(this)
  }

  disconnect() {
    this.deactivate()
    const views = getViews(this.queryClient)
    const viewsOfQuery = views.get(this.queryHash)
    viewsOfQuery?.delete(this)
    if (viewsOfQuery?.size === 0) {
      views.delete(this.queryHash)
    }
  }

  update({
    isActive,
    isTopWorkPending,
  }: {
    isActive: boolean
    isTopWorkPending: boolean
  }) {
    this.isTopWorkPending = isTopWorkPending
    if (isActive && !this.isActive) {
      this.isActive = true
      this.isFocusPending = true
      this.activatedAt = Date.now()
      this.attemptedReturnId = undefined
    } else if (!isActive && this.isActive) {
      this.deactivate()
    }
    this.evaluate()
  }

  /**
   * Records the return on this view's query before anything else can hold it
   * up, if this view is active.
   */
  recordReturn(appReturn: AppReturn) {
    if (!this.isActive) {
      return
    }
    const query = this.getQuery()
    if (!query) {
      return
    }
    const state = getCheckState(
      getPostFeedQueryEntry(this.queryClient, query.queryKey),
    )
    if (state.returnIntent?.id !== appReturn.id) {
      state.returnIntent = {
        id: appReturn.id,
        returnedAt: appReturn.timestamp,
        expiresAt: appReturn.timestamp + RETURN_INTENT_LIFETIME,
      }
    }
    this.evaluate()
  }

  requestCheck() {
    if (!this.isActive) {
      return
    }
    this.isIntervalDue = true
    this.evaluate()
  }

  /**
   * Looks at the query's state and does whatever is owed. Safe to call at any
   * time: it runs again rather than nesting when a check or an `onFound` it
   * calls leads back here synchronously.
   */
  evaluate() {
    if (this.isEvaluating) {
      this.shouldReevaluate = true
      return
    }
    this.isEvaluating = true
    try {
      do {
        this.shouldReevaluate = false
        this.step()
      } while (this.shouldReevaluate)
    } finally {
      this.isEvaluating = false
    }
  }

  private step() {
    const isIntervalDue = this.isIntervalDue
    this.isIntervalDue = false
    if (!this.isActive) {
      return
    }
    const query = this.getQuery()
    if (!query) {
      return
    }
    const entry = getPostFeedQueryEntry(this.queryClient, query.queryKey)
    const state = getCheckState(entry)
    const top = getTopPage(query)
    const now = Date.now()
    const lastSuccessAt = getLastSuccessAt(state, top)
    const isBusy = this.isBusy(query, entry)

    /*
     * What the query already knows goes first, so that a return waiting on its
     * own check does not hold it up. It waits for work on the top like a return
     * does, since that work can replace the top it was measured against.
     */
    const finding = getSharedFinding(state, top)
    if (finding && finding !== this.offeredFinding && !isBusy) {
      this.offeredFinding = finding
      this.isFocusPending = false
      // onFound can start work of its own, so the rest is looked at anew.
      this.isIntervalDue ||= isIntervalDue
      this.shouldReevaluate = true
      this.present(finding.result, finding.trigger)
      return
    }

    const intent = getOpenReturnIntent(state, top, lastSuccessAt, now)

    // Another active view of the query holding the claim keeps it.
    if (intent && (!intent.claimant || intent.claimant === this)) {
      intent.claimant = this
      if (!isBusy) {
        if (intent.finding) {
          state.returnIntent = undefined
          this.isFocusPending = false
          this.present(intent.finding.result, 'return')
          return
        }
        if (now - lastSuccessAt < RETURN_STALE_AFTER) {
          /*
           * Judged as it is handled, which for a return held up by other work
           * can be well after it happened: fresh data, whether from before
           * the reader left or from the work it waited on, needs no check. A
           * pending focus still gets its own gate below.
           */
          state.returnIntent = undefined
        } else if (top && this.attemptedReturnId !== intent.id) {
          // Answers the pending focus too.
          this.run(query, entry, top, 'return')
          return
        }
      }
    }

    // A pending focus waits for the work in its way; an interval tick doesn't.
    if (isBusy) {
      return
    }
    const isFocusPending = this.isFocusPending
    this.isFocusPending = false
    if (!top) {
      return
    }
    const isFocusDue =
      now - lastSuccessAt >= FOCUS_CHECK_AFTER ||
      // Unless something checked or fetched the top since the arrival.
      (lastSuccessAt < this.activatedAt && isEmptyFeed(query))
    if (isFocusPending && isFocusDue) {
      this.run(query, entry, top, 'focus')
    } else if (isIntervalDue) {
      this.run(query, entry, top, 'interval')
    }
  }

  private run(
    query: Query,
    entry: PostFeedQueryEntry,
    top: object,
    trigger: PostFeedCheckTrigger,
  ) {
    const {queryClient, queryHash} = this
    const {queryKey} = query
    const state = getCheckState(entry)
    const generation = entry.generation
    const isCurrent = () =>
      peekPostFeedQueryEntry(queryClient, queryKey) === entry &&
      entry.generation === generation &&
      getTopPage(queryClient.getQueryCache().get(queryHash)) === top

    const returnId = trigger === 'return' ? state.returnIntent?.id : undefined
    const pendingCheck = {isCurrent}
    state.pendingCheck = pendingCheck
    this.isFocusPending = false

    void (async () => {
      let result: unknown
      try {
        result = await this.check({trigger, isCurrent})
      } catch (error) {
        if (state.pendingCheck === pendingCheck) {
          state.pendingCheck = undefined
        }
        /*
         * Only a failure holds the return back from this view. A check that
         * was overtaken instead answered nothing, and is simply made again.
         */
        if (returnId !== undefined && isCurrent()) {
          this.attemptedReturnId = returnId
        }
        if (!isNetworkError(error)) {
          logger.warn('Post feed check failed', {
            trigger,
            message: String(error),
          })
        }
        notifyViews(queryClient, queryHash)
        return
      }

      if (state.pendingCheck === pendingCheck) {
        state.pendingCheck = undefined
      }
      if (peekPostFeedQueryEntry(queryClient, queryKey) !== entry) {
        return
      }
      /*
       * A check overtaken by a fetch from the top, or by a new top page, counts
       * for nothing: it neither moves the clock nor answers a return, which
       * whatever overtook it does instead if it succeeds.
       */
      let foundForTrigger = false
      if (isCurrent()) {
        const now = Date.now()
        const intent = state.returnIntent
        if (intent && !intent.finding && now < intent.expiresAt) {
          /*
           * Settling after the return, this check answers it, whatever asked
           * for it, so the return never gets a check of its own. What it found
           * is the return's to offer only if the query was stale enough, this
           * check aside, for the return to have deserved one: say an interval
           * tick that fired on resume just ahead of the return. Otherwise it
           * goes to whatever asked for this check. The return's share waits
           * for its claimant, or for the next active view if that has gone.
           */
          const isReturnDue =
            now - getLastSuccessAt(state, top) >= RETURN_STALE_AFTER
          if (result !== undefined && isReturnDue) {
            intent.finding = {result, top}
          } else {
            state.returnIntent = undefined
            foundForTrigger = result !== undefined
          }
        } else {
          foundForTrigger = result !== undefined
        }
        state.checkedAt.set(top, now)
        if (foundForTrigger && trigger !== 'return') {
          const finding: SharedFinding = {result, top, trigger}
          state.finding = finding
          // Handed over below rather than offered as it notifies the views.
          if (this.isActive) {
            this.offeredFinding = finding
          }
        }
      }
      notifyViews(queryClient, queryHash)
      if (foundForTrigger && this.isActive) {
        this.present(result, trigger)
      }
    })()
  }

  /**
   * Whether work on the query's top is in flight or pending, which a check
   * would race: a fetch from the top (a first load, a refetch, a reset, or a
   * fetch of newer pages above it), a refresh, another check, or pending work
   * this view was told about. Loading older pages leaves the top alone.
   */
  private isBusy(query: Query, entry: PostFeedQueryEntry) {
    if (entry.refresh) {
      // A failed refresh writes nothing, so its settling is watched directly.
      watchRefresh(this.queryClient, this.queryHash, entry.refresh.promise)
      return true
    }
    const {fetchStatus, fetchMeta} = query.state
    return (
      this.isTopWorkPending ||
      entry.checks?.pendingCheck?.isCurrent() === true ||
      (fetchStatus !== 'idle' && fetchMeta?.fetchMore?.direction !== 'forward')
    )
  }

  /**
   * Hands the claim back, expiry unchanged, so that the next active view of
   * the query can take it.
   */
  private deactivate() {
    this.isActive = false
    this.isFocusPending = false
    this.isIntervalDue = false
    this.attemptedReturnId = undefined
    this.offeredFinding = undefined
    const query = this.getQuery()
    const intent =
      query &&
      peekPostFeedQueryEntry(this.queryClient, query.queryKey)?.checks
        ?.returnIntent
    if (intent?.claimant === this) {
      intent.claimant = undefined
      notifyViews(this.queryClient, this.queryHash)
    }
  }

  /**
   * Hands the view what a check found. This can run inside a query cache
   * listener, so a throw is contained here rather than stopping the listeners
   * after this one, such as the registry's cleanup of removed queries.
   */
  private present(result: unknown, trigger: PostFeedCheckTrigger) {
    try {
      this.onFound(result, trigger)
    } catch (error) {
      logger.error('Post feed check onFound failed', {safeMessage: error})
    }
  }

  private getQuery() {
    return this.queryClient.getQueryCache().get(this.queryHash)
  }
}

function getCheckState(entry: PostFeedQueryEntry) {
  return (entry.checks ??= {checkedAt: new WeakMap()})
}

/** The committed top page of a post-feed query, if it has one. */
function getTopPage(query: Query | undefined): TopPage | undefined {
  const data = query?.state.data as {pages?: TopPage[]} | undefined
  return data?.pages?.[0]
}

/**
 * Whether none of the query's cached pages holds a feed item, which is when
 * its surface shows an empty feed. Items the surface filters out still count.
 */
function isEmptyFeed(query: Query) {
  const data = query.state.data as {pages?: {feed?: unknown}[]} | undefined
  return (data?.pages ?? []).every(
    page => !Array.isArray(page.feed) || page.feed.length === 0,
  )
}

/**
 * The check clock: when the committed top was last fetched or successfully
 * checked.
 */
function getLastSuccessAt(state: PostFeedCheckState, top: TopPage | undefined) {
  if (!top) {
    return -Infinity
  }
  const fetchedAt =
    typeof top.fetchedAt === 'number' ? top.fetchedAt : -Infinity
  return Math.max(fetchedAt, state.checkedAt.get(top) ?? -Infinity)
}

/**
 * The query's finding, dropping it once the top it was measured against is no
 * longer committed.
 */
function getSharedFinding(state: PostFeedCheckState, top: TopPage | undefined) {
  if (state.finding && state.finding.top !== top) {
    state.finding = undefined
  }
  return state.finding
}

/**
 * The return the query still owes, dropping it once it has expired or been
 * answered: by a check or fetch from the top that settled after it and found
 * nothing, or by the replacement of the top a finding was measured against.
 */
function getOpenReturnIntent(
  state: PostFeedCheckState,
  top: TopPage | undefined,
  lastSuccessAt: number,
  now: number,
) {
  const intent = state.returnIntent
  if (!intent) {
    return undefined
  }
  if (intent.finding && intent.finding.top !== top) {
    intent.finding = undefined
  }
  const isAnswered = !intent.finding && lastSuccessAt >= intent.returnedAt
  if (now >= intent.expiresAt || isAnswered) {
    state.returnIntent = undefined
    return undefined
  }
  return intent
}

/**
 * The mounted views of each query, by query hash, for each account's client.
 * Views register and unregister themselves, so nothing here outlives them.
 */
const viewsByClient = new WeakMap<
  QueryClient,
  Map<string, Set<PostFeedCheckView>>
>()

function getViews(queryClient: QueryClient) {
  let views = viewsByClient.get(queryClient)
  if (!views) {
    const created = new Map<string, Set<PostFeedCheckView>>()
    /*
     * A query's fetches, writes and removal can each unblock or answer what
     * its views are waiting on. Lives as long as the client's cache, like the
     * registry's own subscription.
     */
    queryClient.getQueryCache().subscribe(event => {
      if (
        event.type === 'added' ||
        event.type === 'updated' ||
        event.type === 'removed'
      ) {
        for (const view of [...(created.get(event.query.queryHash) ?? [])]) {
          view.evaluate()
        }
      }
    })
    viewsByClient.set(queryClient, created)
    views = created
  }
  return views
}

function notifyViews(queryClient: QueryClient, queryHash: string) {
  const views = viewsByClient.get(queryClient)?.get(queryHash)
  for (const view of [...(views ?? [])]) {
    view.evaluate()
  }
}

const watchedRefreshes = new WeakSet<Promise<unknown>>()

function watchRefresh(
  queryClient: QueryClient,
  queryHash: string,
  refresh: Promise<unknown>,
) {
  if (watchedRefreshes.has(refresh)) {
    return
  }
  watchedRefreshes.add(refresh)
  const notify = () => notifyViews(queryClient, queryHash)
  refresh.then(notify, notify)
}
