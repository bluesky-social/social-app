/*
 * Types only, so `#/analytics/metrics/types` can import them.
 */

/**
 * The Atmosphere screen's tabs, in pager order. `'discover'` and `'following'`
 * are the For You and Activity tabs; the values are kept so event data stays
 * continuous with what was logged before the tabs were renamed. `'combined'`
 * is Activity with For You mixed in, in development.
 */
export type AtmosphereTab =
  'discover' | 'following' | 'explore' | 'apps' | 'combined'

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
 * Details for Explore's featured apps and the Apps directory. App cards do
 * not log impressions; these events count actions, not people who saw the card.
 */
export type AtmosphereAppMetricContext = AtmosphereMetricContext & {
  /** The DID of the app's Bluesky profile, if it has one. */
  appProfileDid?: string
  /** The app's website. An app has a website, a profile, or both. */
  appUrl?: string
  /** The app's own category key, e.g. `writing`, if any. */
  appCategory?: string
  /** 0-based, in Explore's featured apps or the Apps tab's filtered list. */
  position: number
  /**
   * Whether the card shows social proof: the app's follower count and/or
   * people you follow who also follow its Bluesky profile.
   */
  hasSocialProof: boolean
  /** Apps tab only: the category filter in use, e.g. `all`. */
  selectedCategory?: string
}

/** Explore's sections of featured apps and content. */
export type AtmosphereExploreTabSection =
  'apps' | 'articles' | 'livestreams' | 'photos' | 'publications'

/** One content card, as reported by Atmosphere's content events. */
export type AtmosphereContentMetricContext = AtmosphereMetricContext & {
  /**
   * The AT URI of the content's own record, such as the article, which also
   * keys it across responses. On a recommendation it's the recommended
   * article, not the recommendation.
   */
  uri: string
  /** The collection (record NSID) in `uri`. */
  collection: string
  /** The DID in `uri`: whoever owns the content. */
  authorDid: string
  /**
   * 0-based, in its list or, on Explore, its section. Can differ between events
   * for the same content.
   */
  position: number
  /** Explore's section the card is in. */
  section?: Exclude<AtmosphereExploreTabSection, 'apps'>
  /**
   * Activity only: the collection (record NSID) of the activity that got the
   * content shown, e.g. a recommend, which can differ from `collection`.
   */
  activityReferrerCollection?: string
  /**
   * Activity only: one activity, one actor's activities on several records
   * (`actorGroup`), or several actors' activity on one record
   * (`subjectGroup`).
   */
  activityReferrerGrouping?: 'single' | 'actorGroup' | 'subjectGroup'
}
