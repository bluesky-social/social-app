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
 */
export type AtmosphereSurface = 'tab' | 'activityList' | 'photoDialog'

export type AtmosphereMetricContext = {
  /**
   * The tab the event happened on, or the activity list or dialog was opened
   * from. Unset when it isn't known, e.g. an activity list opened from a link.
   */
  tab?: AtmosphereTab
  surface: AtmosphereSurface
}

/** One content card, as reported by Atmosphere's content events. */
export type AtmosphereContentMetricContext = AtmosphereMetricContext & {
  contentType: 'article' | 'publication' | 'gallery' | 'livestream'
  /** The content's URL, which also keys it across responses. */
  contentId: string
  /** 0-based, in its list or, on Explore, its section. */
  position: number
  /** Explore's section the card is in. */
  section?: 'articles' | 'livestreams' | 'photos' | 'publications'
  /** Following only: the collection (record NSID) of the activity. */
  collection?: string
  /**
   * Following only: one activity, one actor's activities on several records
   * (`actorGroup`), or several actors' activity on one record
   * (`subjectGroup`).
   */
  grouping?: 'single' | 'actorGroup' | 'subjectGroup'
}
