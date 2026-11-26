import {type ActivityRow} from '#/screens/Atmosphere/ActivityTab/rows'
import {type ForYouItem} from '#/screens/Atmosphere/ForYouTab/useAtmosphereRecommendedActivityQuery'

/** Fewest activity rows before each mixed-in recommendation. */
const MIN_RECOMMENDATION_GAP = 3
/** Most activity rows before each mixed-in recommendation. */
const MAX_RECOMMENDATION_GAP = 10
/** Rows before the first interstitial. */
const FIRST_INTERSTITIAL_AFTER = 2
/** Rows between interstitials after the first. */
const INTERSTITIAL_EVERY = 15

/**
 * A full-width module between feed rows, such as the featured apps carousel.
 * It loads its own data, and renders nothing if there's none.
 */
export type CombinedInterstitial = {
  key: string
  type: 'featuredApps'
}

/**
 * When activity happened, relative to today, in local time. "pastWeek" is the
 * rolling 2 to 6 days before today, not the calendar week.
 */
export type CombinedDateBucket = 'today' | 'yesterday' | 'pastWeek' | 'earlier'

const DATE_BUCKETS: CombinedDateBucket[] = [
  'today',
  'yesterday',
  'pastWeek',
  'earlier',
]

export type CombinedRow =
  | {kind: 'activity'; key: string; row: ActivityRow}
  | {kind: 'dateHeader'; key: string; bucket: CombinedDateBucket}
  | {
      kind: 'recommended'
      key: string
      item: ForYouItem
      /** 0-based, among the recommendations in the feed, for feed feedback. */
      recommendationPosition: number
      /**
       * Mixed into activity, so it's labeled on its own. Rows after the
       * section header aren't.
       */
      eyebrow: boolean
    }
  | {
      /** Starts the recommendations that follow the end of activity. */
      kind: 'recommendedHeader'
      key: string
      /** Whether there was activity above it, so the viewer is caught up. */
      caughtUp: boolean
    }
  | {kind: 'interstitial'; key: string; interstitial: CombinedInterstitial}

/**
 * Mixes recommendations, and later interstitials, into the activity timeline.
 * Activity keeps its time order under date headers, with a recommendation
 * after a random 3 to 10 rows. Recommendations only ever follow activity, so
 * each date section starts with activity from that date.
 * Once activity runs out, the rest of the recommendations follow under a
 * header, so a viewer with little or no activity still gets a feed.
 *
 * Each page's rows depend only on the pages before it, so loading another
 * page appends rows without moving any already shown.
 */
export function mixCombinedPages({
  activityPages,
  recommendations,
  interstitials = [],
  isLastPage,
  random,
  now = new Date(),
}: {
  /** Each timeline page's rows, in order. */
  activityPages: ActivityRow[][]
  /** In recommendation order. */
  recommendations: ForYouItem[]
  /** In order; placed at fixed slots. */
  interstitials?: CombinedInterstitial[]
  /** Whether the last page ended the timeline. */
  isLastPage: boolean
  /**
   * Returns a number in [0, 1), like `Math.random`. Use `seededRandom` so the
   * spacing stays put when the rows are recomputed or another page loads.
   */
  random: () => number
  /** Where the date sections start from. */
  now?: Date
}): {pages: CombinedRow[][]; recommendedItems: ForYouItem[]} {
  /** Content already shown as activity, which a recommendation would repeat. */
  const shownUris = new Set<string>()
  const recommendedItems: ForYouItem[] = []
  let nextRecommendation = 0
  let nextInterstitial = 0
  let activitySinceRecommendation = 0
  let rowCount = 0
  const nextGap = () =>
    MIN_RECOMMENDATION_GAP +
    Math.floor(random() * (MAX_RECOMMENDATION_GAP - MIN_RECOMMENDATION_GAP + 1))
  let recommendationGap = nextGap()
  const getDateBucket = createDateBucketer(now)
  /*
   * Index into DATE_BUCKETS. Only moves forward, so a slightly out-of-order
   * row can't repeat a header.
   */
  let dateBucketIndex = -1

  const takeRecommendation = () => {
    while (nextRecommendation < recommendations.length) {
      const item = recommendations[nextRecommendation++]
      if (!shownUris.has(item.content.view.uri)) return item
    }
  }

  const pages = activityPages.map((activityRows, pageIndex) => {
    for (const row of activityRows) {
      if (row.kind === 'card') shownUris.add(row.content.view.uri)
    }

    const rows: CombinedRow[] = []
    const push = (row: CombinedRow) => {
      rows.push(row)
      rowCount++
      const slot = rowCount - FIRST_INTERSTITIAL_AFTER
      if (
        slot >= 0 &&
        slot % INTERSTITIAL_EVERY === 0 &&
        nextInterstitial < interstitials.length
      ) {
        const interstitial = interstitials[nextInterstitial++]
        rows.push({
          kind: 'interstitial',
          key: `interstitial:${interstitial.key}`,
          interstitial,
        })
      }
    }
    const pushRecommendation = (item: ForYouItem, eyebrow: boolean) => {
      push({
        kind: 'recommended',
        key: `recommended:${item.reqId}:${item.content.view.uri}`,
        item,
        recommendationPosition: recommendedItems.length,
        eyebrow,
      })
      recommendedItems.push(item)
    }

    for (const row of activityRows) {
      // Warnings have no date, so they stay in the current section.
      const bucket = row.kind === 'card' && getDateBucket(row.indexedAt)
      if (bucket && DATE_BUCKETS.indexOf(bucket) > dateBucketIndex) {
        dateBucketIndex = DATE_BUCKETS.indexOf(bucket)
        // Not through `push`, so headers don't count toward interstitial slots.
        rows.push({kind: 'dateHeader', key: `dateHeader:${bucket}`, bucket})
      }
      push({kind: 'activity', key: `activity:${row.key}`, row})
      activitySinceRecommendation++
      if (activitySinceRecommendation >= recommendationGap) {
        const item = takeRecommendation()
        if (item) pushRecommendation(item, true)
        activitySinceRecommendation = 0
        recommendationGap = nextGap()
      }
    }

    if (isLastPage && pageIndex === activityPages.length - 1) {
      let item = takeRecommendation()
      if (item) {
        push({
          kind: 'recommendedHeader',
          key: 'recommendedHeader',
          caughtUp: rowCount > 0,
        })
      }
      while (item) {
        pushRecommendation(item, false)
        item = takeRecommendation()
      }
    }

    return rows
  })

  return {pages, recommendedItems}
}

/** Buckets dates by local calendar day, counting back from `now`. */
function createDateBucketer(now: Date) {
  const daysAgo = (days: number) => {
    // setDate, rather than subtracting milliseconds, handles DST changes.
    const date = new Date(now)
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - days)
    return date.getTime()
  }
  const startOfToday = daysAgo(0)
  const startOfYesterday = daysAgo(1)
  const startOfPastWeek = daysAgo(6)

  return (indexedAt: string): CombinedDateBucket | undefined => {
    const time = new Date(indexedAt).getTime()
    if (Number.isNaN(time)) return undefined
    // Includes anything dated ahead of the device clock.
    if (time >= startOfToday) return 'today'
    if (time >= startOfYesterday) return 'yesterday'
    if (time >= startOfPastWeek) return 'pastWeek'
    return 'earlier'
  }
}

/**
 * A repeatable `random` for `mixCombinedPages`: the same seed, such as a
 * recommendation request's ID, gives the same sequence (mulberry32).
 */
export function seededRandom(seed: string) {
  let state = 0
  for (let i = 0; i < seed.length; i++) {
    state = Math.imul(state ^ seed.charCodeAt(i), 0x5bd1e995)
    state ^= state >>> 15
  }
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
