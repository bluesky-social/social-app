/*
 * Types only, so `#/analytics/metrics/types` can import them.
 */

/** The Atmosphere screen's tabs, in pager order. */
export type AtmosphereTab = 'discover' | 'following' | 'explore' | 'apps'

/**
 * Where in Atmosphere an event happened:
 * - `tab`: one of the Atmosphere screen's tabs.
 * - `activityList`: the activity list opened from a card's "View all".
 * - `photoDialog`: the photo dialog opened from a gallery card.
 * - `appDialog`: the details dialog opened from an Apps tab card.
 */
export type AtmosphereSurface =
  'tab' | 'activityList' | 'photoDialog' | 'appDialog'

export type AtmosphereMetricContext = {
  /**
   * The tab the event happened on, or a dialog was opened from. Unset for
   * activity lists and dialogs opened from them.
   */
  tab?: AtmosphereTab
  surface: AtmosphereSurface
}

/**
 * One app card, as reported by Atmosphere's app events: Explore's featured
 * apps, and the Apps tab's directory.
 */
export type AtmosphereAppMetricContext = AtmosphereMetricContext & {
  appId: string
  /** The app's own category key, e.g. `writing`, if any. */
  appCategory?: string
  /** 0-based, in Explore's featured apps or the Apps tab's filtered list. */
  position: number
  /** Whether the card shows followers of the app's profile you know. */
  hasKnownFollowers: boolean
  /** Apps tab only: the category filter in use, e.g. `all`. */
  selectedCategory?: string
}

/** Explore's sections of featured apps and content. */
export type AtmosphereSection =
  'apps' | 'articles' | 'livestreams' | 'photos' | 'publications'

/** One content card, as reported by Atmosphere's content events. */
export type AtmosphereContentMetricContext = AtmosphereMetricContext & {
  contentType: 'article' | 'publication' | 'gallery' | 'livestream'
  /** The content's URL, which also keys it across responses. */
  contentId: string
  /** 0-based, in its list or, on Explore, its section. */
  position: number
  /** Explore's section the card is in. */
  section?: Exclude<AtmosphereSection, 'apps'>
  /** Following only: the collection (record NSID) of the activity. */
  collection?: string
  /**
   * Following only: one activity, one actor's activities on several records
   * (`actorGroup`), or several actors' activity on one record
   * (`subjectGroup`).
   */
  grouping?: 'single' | 'actorGroup' | 'subjectGroup'
}
