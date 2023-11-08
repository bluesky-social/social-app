import {makeAutoObservable, runInAction} from 'mobx'
import {
  LabelPreference as APILabelPreference,
  BskyFeedViewPreference,
  BskyThreadViewPreference,
} from '@atproto/api'
import AwaitLock from 'await-lock'
import isEqual from 'lodash.isequal'
import {isObj, hasProp} from 'lib/type-guards'
import {RootStoreModel} from '../root-store'
import {ModerationOpts} from '@atproto/api'
import {DEFAULT_FEEDS} from 'lib/constants'
import {getAge} from 'lib/strings/time'
import {FeedTuner} from 'lib/api/feed-manip'
import {logger} from '#/logger'
import {getContentLanguages} from '#/state/preferences/languages'

// TEMP we need to permanently convert 'show' to 'ignore', for now we manually convert -prf
export type LabelPreference = APILabelPreference | 'show'
export type FeedViewPreference = BskyFeedViewPreference & {
  lab_mergeFeedEnabled?: boolean | undefined
}
export type ThreadViewPreference = BskyThreadViewPreference & {
  lab_treeViewEnabled?: boolean | undefined
}
const LABEL_GROUPS = [
  'nsfw',
  'nudity',
  'suggestive',
  'gore',
  'hate',
  'spam',
  'impersonation',
]
const VISIBILITY_VALUES = ['ignore', 'warn', 'hide']
const THREAD_SORT_VALUES = ['oldest', 'newest', 'most-likes', 'random']

interface LegacyPreferences {
  hideReplies?: boolean
  hideRepliesByLikeCount?: number
  hideReposts?: boolean
  hideQuotePosts?: boolean
}

export class LabelPreferencesModel {
  nsfw: LabelPreference = 'hide'
  nudity: LabelPreference = 'warn'
  suggestive: LabelPreference = 'warn'
  gore: LabelPreference = 'warn'
  hate: LabelPreference = 'hide'
  spam: LabelPreference = 'hide'
  impersonation: LabelPreference = 'warn'

  constructor() {
    makeAutoObservable(this, {}, {autoBind: true})
  }
}

export class PreferencesModel {
  adultContentEnabled = false
  contentLabels = new LabelPreferencesModel()
  savedFeeds: string[] = []
  pinnedFeeds: string[] = []
  birthDate: Date | undefined = undefined
  homeFeed: FeedViewPreference = {
    hideReplies: false,
    hideRepliesByUnfollowed: false,
    hideRepliesByLikeCount: 0,
    hideReposts: false,
    hideQuotePosts: false,
    lab_mergeFeedEnabled: false, // experimental
  }
  thread: ThreadViewPreference = {
    sort: 'oldest',
    prioritizeFollowedUsers: true,
    lab_treeViewEnabled: false, // experimental
  }

  // used to help with transitions from device-stored to server-stored preferences
  legacyPreferences: LegacyPreferences | undefined

  // used to linearize async modifications to state
  lock = new AwaitLock()

  constructor(public rootStore: RootStoreModel) {
    makeAutoObservable(this, {lock: false}, {autoBind: true})
  }

  get userAge(): number | undefined {
    if (!this.birthDate) {
      return undefined
    }
    return getAge(this.birthDate)
  }

  serialize() {
    return {
      contentLabels: this.contentLabels,
      savedFeeds: this.savedFeeds,
      pinnedFeeds: this.pinnedFeeds,
    }
  }

  /**
   * The function hydrates an object with properties related to content languages, labels, saved feeds,
   * and pinned feeds that it gets from the parameter `v` (probably local storage)
   * @param {unknown} v - the data object to hydrate from
   */
  hydrate(v: unknown) {
    if (isObj(v)) {
      // check if content labels in preferences exist, then hydrate
      if (hasProp(v, 'contentLabels') && typeof v.contentLabels === 'object') {
        Object.assign(this.contentLabels, v.contentLabels)
      }
      // check if saved feeds in preferences, then hydrate
      if (
        hasProp(v, 'savedFeeds') &&
        Array.isArray(v.savedFeeds) &&
        typeof v.savedFeeds.every(item => typeof item === 'string')
      ) {
        this.savedFeeds = v.savedFeeds
      }
      // check if pinned feeds in preferences exist, then hydrate
      if (
        hasProp(v, 'pinnedFeeds') &&
        Array.isArray(v.pinnedFeeds) &&
        typeof v.pinnedFeeds.every(item => typeof item === 'string')
      ) {
        this.pinnedFeeds = v.pinnedFeeds
      }
      // grab legacy values
      this.legacyPreferences = getLegacyPreferences(v)
    }
  }

  /**
   * This function fetches preferences and sets defaults for missing items.
   */
  async sync() {
    await this.lock.acquireAsync()
    try {
      // fetch preferences
      const prefs = await this.rootStore.agent.getPreferences()

      runInAction(() => {
        if (prefs.feedViewPrefs.home) {
          this.homeFeed = prefs.feedViewPrefs.home
        }
        this.thread = prefs.threadViewPrefs
        this.adultContentEnabled = prefs.adultContentEnabled
        for (const label in prefs.contentLabels) {
          if (
            LABEL_GROUPS.includes(label) &&
            VISIBILITY_VALUES.includes(prefs.contentLabels[label])
          ) {
            this.contentLabels[label as keyof LabelPreferencesModel] =
              prefs.contentLabels[label]
          }
        }
        if (prefs.feeds.saved && !isEqual(this.savedFeeds, prefs.feeds.saved)) {
          this.savedFeeds = prefs.feeds.saved
        }
        if (
          prefs.feeds.pinned &&
          !isEqual(this.pinnedFeeds, prefs.feeds.pinned)
        ) {
          this.pinnedFeeds = prefs.feeds.pinned
        }
        this.birthDate = prefs.birthDate
      })

      // sync legacy values if needed
      await this.syncLegacyPreferences()

      // set defaults on missing items
      if (typeof prefs.feeds.saved === 'undefined') {
        try {
          const {saved, pinned} = await DEFAULT_FEEDS(
            this.rootStore.agent.service.toString(),
            (handle: string) =>
              this.rootStore.agent
                .resolveHandle({handle})
                .then(({data}) => data.did),
          )
          runInAction(() => {
            this.savedFeeds = saved
            this.pinnedFeeds = pinned
          })
          await this.rootStore.agent.setSavedFeeds(saved, pinned)
        } catch (error) {
          logger.error('Failed to set default feeds', {error})
        }
      }
    } finally {
      this.lock.release()
    }
  }

  async syncLegacyPreferences() {
    if (this.legacyPreferences) {
      this.homeFeed = {...this.homeFeed, ...this.legacyPreferences}
      this.legacyPreferences = undefined
      await this.rootStore.agent.setFeedViewPrefs('home', this.homeFeed)
    }
  }

  /**
   * This function resets the preferences to an empty array of no preferences.
   */
  async reset() {
    await this.lock.acquireAsync()
    try {
      runInAction(() => {
        this.contentLabels = new LabelPreferencesModel()
        this.savedFeeds = []
        this.pinnedFeeds = []
      })
      await this.rootStore.agent.app.bsky.actor.putPreferences({
        preferences: [],
      })
    } finally {
      this.lock.release()
    }
  }

  // moderation
  // =

  async setContentLabelPref(
    key: keyof LabelPreferencesModel,
    value: LabelPreference,
  ) {
    this.contentLabels[key] = value
    await this.rootStore.agent.setContentLabelPref(key, value)
  }

  async setAdultContentEnabled(v: boolean) {
    this.adultContentEnabled = v
    await this.rootStore.agent.setAdultContentEnabled(v)
  }

  get moderationOpts(): ModerationOpts {
    return {
      userDid: this.rootStore.session.currentSession?.did || '',
      adultContentEnabled: this.adultContentEnabled,
      labels: {
        // TEMP translate old settings until this UI can be migrated -prf
        porn: tempfixLabelPref(this.contentLabels.nsfw),
        sexual: tempfixLabelPref(this.contentLabels.suggestive),
        nudity: tempfixLabelPref(this.contentLabels.nudity),
        nsfl: tempfixLabelPref(this.contentLabels.gore),
        corpse: tempfixLabelPref(this.contentLabels.gore),
        gore: tempfixLabelPref(this.contentLabels.gore),
        torture: tempfixLabelPref(this.contentLabels.gore),
        'self-harm': tempfixLabelPref(this.contentLabels.gore),
        'intolerant-race': tempfixLabelPref(this.contentLabels.hate),
        'intolerant-gender': tempfixLabelPref(this.contentLabels.hate),
        'intolerant-sexual-orientation': tempfixLabelPref(
          this.contentLabels.hate,
        ),
        'intolerant-religion': tempfixLabelPref(this.contentLabels.hate),
        intolerant: tempfixLabelPref(this.contentLabels.hate),
        'icon-intolerant': tempfixLabelPref(this.contentLabels.hate),
        spam: tempfixLabelPref(this.contentLabels.spam),
        impersonation: tempfixLabelPref(this.contentLabels.impersonation),
        scam: 'warn',
      },
      labelers: [
        {
          labeler: {
            did: '',
            displayName: 'Bluesky Social',
          },
          labels: {},
        },
      ],
    }
  }

  // feeds
  // =

  isPinnedFeed(uri: string) {
    return this.pinnedFeeds.includes(uri)
  }

  async _optimisticUpdateSavedFeeds(
    saved: string[],
    pinned: string[],
    cb: () => Promise<{saved: string[]; pinned: string[]}>,
  ) {
    const oldSaved = this.savedFeeds
    const oldPinned = this.pinnedFeeds
    this.savedFeeds = saved
    this.pinnedFeeds = pinned
    await this.lock.acquireAsync()
    try {
      const res = await cb()
      runInAction(() => {
        this.savedFeeds = res.saved
        this.pinnedFeeds = res.pinned
      })
    } catch (e) {
      runInAction(() => {
        this.savedFeeds = oldSaved
        this.pinnedFeeds = oldPinned
      })
      throw e
    } finally {
      this.lock.release()
    }
  }

  async setSavedFeeds(saved: string[], pinned: string[]) {
    return this._optimisticUpdateSavedFeeds(saved, pinned, () =>
      this.rootStore.agent.setSavedFeeds(saved, pinned),
    )
  }

  async addSavedFeed(v: string) {
    return this._optimisticUpdateSavedFeeds(
      [...this.savedFeeds.filter(uri => uri !== v), v],
      this.pinnedFeeds,
      () => this.rootStore.agent.addSavedFeed(v),
    )
  }

  async removeSavedFeed(v: string) {
    return this._optimisticUpdateSavedFeeds(
      this.savedFeeds.filter(uri => uri !== v),
      this.pinnedFeeds.filter(uri => uri !== v),
      () => this.rootStore.agent.removeSavedFeed(v),
    )
  }

  async addPinnedFeed(v: string) {
    return this._optimisticUpdateSavedFeeds(
      [...this.savedFeeds.filter(uri => uri !== v), v],
      [...this.pinnedFeeds.filter(uri => uri !== v), v],
      () => this.rootStore.agent.addPinnedFeed(v),
    )
  }

  async removePinnedFeed(v: string) {
    return this._optimisticUpdateSavedFeeds(
      this.savedFeeds,
      this.pinnedFeeds.filter(uri => uri !== v),
      () => this.rootStore.agent.removePinnedFeed(v),
    )
  }

  // other
  // =

  async setBirthDate(birthDate: Date) {
    this.birthDate = birthDate
    await this.lock.acquireAsync()
    try {
      await this.rootStore.agent.setPersonalDetails({birthDate})
    } finally {
      this.lock.release()
    }
  }

  async toggleHomeFeedHideReplies() {
    this.homeFeed.hideReplies = !this.homeFeed.hideReplies
    await this.lock.acquireAsync()
    try {
      await this.rootStore.agent.setFeedViewPrefs('home', {
        hideReplies: this.homeFeed.hideReplies,
      })
    } finally {
      this.lock.release()
    }
  }

  async toggleHomeFeedHideRepliesByUnfollowed() {
    this.homeFeed.hideRepliesByUnfollowed =
      !this.homeFeed.hideRepliesByUnfollowed
    await this.lock.acquireAsync()
    try {
      await this.rootStore.agent.setFeedViewPrefs('home', {
        hideRepliesByUnfollowed: this.homeFeed.hideRepliesByUnfollowed,
      })
    } finally {
      this.lock.release()
    }
  }

  async setHomeFeedHideRepliesByLikeCount(threshold: number) {
    this.homeFeed.hideRepliesByLikeCount = threshold
    await this.lock.acquireAsync()
    try {
      await this.rootStore.agent.setFeedViewPrefs('home', {
        hideRepliesByLikeCount: this.homeFeed.hideRepliesByLikeCount,
      })
    } finally {
      this.lock.release()
    }
  }

  async toggleHomeFeedHideReposts() {
    this.homeFeed.hideReposts = !this.homeFeed.hideReposts
    await this.lock.acquireAsync()
    try {
      await this.rootStore.agent.setFeedViewPrefs('home', {
        hideReposts: this.homeFeed.hideReposts,
      })
    } finally {
      this.lock.release()
    }
  }

  async toggleHomeFeedHideQuotePosts() {
    this.homeFeed.hideQuotePosts = !this.homeFeed.hideQuotePosts
    await this.lock.acquireAsync()
    try {
      await this.rootStore.agent.setFeedViewPrefs('home', {
        hideQuotePosts: this.homeFeed.hideQuotePosts,
      })
    } finally {
      this.lock.release()
    }
  }

  async toggleHomeFeedMergeFeedEnabled() {
    this.homeFeed.lab_mergeFeedEnabled = !this.homeFeed.lab_mergeFeedEnabled
    await this.lock.acquireAsync()
    try {
      await this.rootStore.agent.setFeedViewPrefs('home', {
        lab_mergeFeedEnabled: this.homeFeed.lab_mergeFeedEnabled,
      })
    } finally {
      this.lock.release()
    }
  }

  async setThreadSort(v: string) {
    if (THREAD_SORT_VALUES.includes(v)) {
      this.thread.sort = v
      await this.lock.acquireAsync()
      try {
        await this.rootStore.agent.setThreadViewPrefs({sort: v})
      } finally {
        this.lock.release()
      }
    }
  }

  async togglePrioritizedFollowedUsers() {
    this.thread.prioritizeFollowedUsers = !this.thread.prioritizeFollowedUsers
    await this.lock.acquireAsync()
    try {
      await this.rootStore.agent.setThreadViewPrefs({
        prioritizeFollowedUsers: this.thread.prioritizeFollowedUsers,
      })
    } finally {
      this.lock.release()
    }
  }

  async toggleThreadTreeViewEnabled() {
    this.thread.lab_treeViewEnabled = !this.thread.lab_treeViewEnabled
    await this.lock.acquireAsync()
    try {
      await this.rootStore.agent.setThreadViewPrefs({
        lab_treeViewEnabled: this.thread.lab_treeViewEnabled,
      })
    } finally {
      this.lock.release()
    }
  }

  getFeedTuners(
    feedType: 'home' | 'following' | 'author' | 'custom' | 'list' | 'likes',
  ) {
    if (feedType === 'custom') {
      return [
        FeedTuner.dedupReposts,
        FeedTuner.preferredLangOnly(getContentLanguages()),
      ]
    }
    if (feedType === 'list') {
      return [FeedTuner.dedupReposts]
    }
    if (feedType === 'home' || feedType === 'following') {
      const feedTuners = []

      if (this.homeFeed.hideReposts) {
        feedTuners.push(FeedTuner.removeReposts)
      } else {
        feedTuners.push(FeedTuner.dedupReposts)
      }

      if (this.homeFeed.hideReplies) {
        feedTuners.push(FeedTuner.removeReplies)
      } else {
        feedTuners.push(
          FeedTuner.thresholdRepliesOnly({
            userDid: this.rootStore.session.data?.did || '',
            minLikes: this.homeFeed.hideRepliesByLikeCount,
            followedOnly: !!this.homeFeed.hideRepliesByUnfollowed,
          }),
        )
      }

      if (this.homeFeed.hideQuotePosts) {
        feedTuners.push(FeedTuner.removeQuotePosts)
      }

      return feedTuners
    }
    return []
  }
}

// TEMP we need to permanently convert 'show' to 'ignore', for now we manually convert -prf
function tempfixLabelPref(pref: LabelPreference): APILabelPreference {
  if (pref === 'show') {
    return 'ignore'
  }
  return pref
}

function getLegacyPreferences(
  v: Record<string, unknown>,
): LegacyPreferences | undefined {
  const legacyPreferences: LegacyPreferences = {}
  if (
    hasProp(v, 'homeFeedRepliesEnabled') &&
    typeof v.homeFeedRepliesEnabled === 'boolean'
  ) {
    legacyPreferences.hideReplies = !v.homeFeedRepliesEnabled
  }
  if (
    hasProp(v, 'homeFeedRepliesThreshold') &&
    typeof v.homeFeedRepliesThreshold === 'number'
  ) {
    legacyPreferences.hideRepliesByLikeCount = v.homeFeedRepliesThreshold
  }
  if (
    hasProp(v, 'homeFeedRepostsEnabled') &&
    typeof v.homeFeedRepostsEnabled === 'boolean'
  ) {
    legacyPreferences.hideReposts = !v.homeFeedRepostsEnabled
  }
  if (
    hasProp(v, 'homeFeedQuotePostsEnabled') &&
    typeof v.homeFeedQuotePostsEnabled === 'boolean'
  ) {
    legacyPreferences.hideQuotePosts = !v.homeFeedQuotePostsEnabled
  }
  if (Object.keys(legacyPreferences).length) {
    return legacyPreferences
  }
  return undefined
}
