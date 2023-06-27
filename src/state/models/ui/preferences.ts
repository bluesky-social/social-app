import {makeAutoObservable, runInAction} from 'mobx'
import AwaitLock from 'await-lock'
import isEqual from 'lodash.isequal'
import {isObj, hasProp} from 'lib/type-guards'
import {RootStoreModel} from '../root-store'
import {ComAtprotoLabelDefs, AppBskyActorDefs} from '@atproto/api'
import {LabelValGroup} from 'lib/labeling/types'
import {getLabelValueGroup} from 'lib/labeling/helpers'
import {
  UNKNOWN_LABEL_GROUP,
  ILLEGAL_LABEL_GROUP,
  ALWAYS_FILTER_LABEL_GROUP,
  ALWAYS_WARN_LABEL_GROUP,
} from 'lib/labeling/const'
import {DEFAULT_FEEDS} from 'lib/constants'
import {isIOS, deviceLocales} from 'platform/detection'
import {LANGUAGES} from '../../../locale/languages'

export type LabelPreference = 'show' | 'warn' | 'hide'
const LABEL_GROUPS = [
  'nsfw',
  'nudity',
  'suggestive',
  'gore',
  'hate',
  'spam',
  'impersonation',
]
const VISIBILITY_VALUES = ['show', 'warn', 'hide']

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
  adultContentEnabled = !isIOS
  contentLanguages: string[] = deviceLocales || []
  postLanguages: string[] = deviceLocales || []
  contentLabels = new LabelPreferencesModel()
  savedFeeds: string[] = []
  pinnedFeeds: string[] = []
  homeFeedRepliesEnabled: boolean = true
  homeFeedRepliesThreshold: number = 2
  homeFeedRepostsEnabled: boolean = true
  homeFeedQuotePostsEnabled: boolean = true
  requireAltTextEnabled: boolean = false

  // used to linearize async modifications to state
  lock = new AwaitLock()

  constructor(public rootStore: RootStoreModel) {
    makeAutoObservable(this, {lock: false}, {autoBind: true})
  }

  serialize() {
    return {
      contentLanguages: this.contentLanguages,
      postLanguages: this.postLanguages,
      contentLabels: this.contentLabels,
      savedFeeds: this.savedFeeds,
      pinnedFeeds: this.pinnedFeeds,
      homeFeedRepliesEnabled: this.homeFeedRepliesEnabled,
      homeFeedRepliesThreshold: this.homeFeedRepliesThreshold,
      homeFeedRepostsEnabled: this.homeFeedRepostsEnabled,
      homeFeedQuotePostsEnabled: this.homeFeedQuotePostsEnabled,
      requireAltTextEnabled: this.requireAltTextEnabled,
    }
  }

  /**
   * The function hydrates an object with properties related to content languages, labels, saved feeds,
   * and pinned feeds that it gets from the parameter `v` (probably local storage)
   * @param {unknown} v - the data object to hydrate from
   */
  hydrate(v: unknown) {
    if (isObj(v)) {
      // check if content languages in preferences exist, otherwise default to device languages
      if (
        hasProp(v, 'contentLanguages') &&
        Array.isArray(v.contentLanguages) &&
        typeof v.contentLanguages.every(item => typeof item === 'string')
      ) {
        this.contentLanguages = v.contentLanguages
      } else {
        // default to the device languages
        this.contentLanguages = deviceLocales
      }
      // check if post languages in preferences exist, otherwise default to device languages
      if (
        hasProp(v, 'postLanguages') &&
        Array.isArray(v.postLanguages) &&
        typeof v.postLanguages.every(item => typeof item === 'string')
      ) {
        this.postLanguages = v.postLanguages
      } else {
        // default to the device languages
        this.postLanguages = deviceLocales
      }
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
      // check if home feed replies are enabled in preferences, then hydrate
      if (
        hasProp(v, 'homeFeedRepliesEnabled') &&
        typeof v.homeFeedRepliesEnabled === 'boolean'
      ) {
        this.homeFeedRepliesEnabled = v.homeFeedRepliesEnabled
      }
      // check if home feed replies threshold is enabled in preferences, then hydrate
      if (
        hasProp(v, 'homeFeedRepliesThreshold') &&
        typeof v.homeFeedRepliesThreshold === 'number'
      ) {
        this.homeFeedRepliesThreshold = v.homeFeedRepliesThreshold
      }
      // check if home feed reposts are enabled in preferences, then hydrate
      if (
        hasProp(v, 'homeFeedRepostsEnabled') &&
        typeof v.homeFeedRepostsEnabled === 'boolean'
      ) {
        this.homeFeedRepostsEnabled = v.homeFeedRepostsEnabled
      }
      // check if home feed quote posts are enabled in preferences, then hydrate
      if (
        hasProp(v, 'homeFeedQuotePostsEnabled') &&
        typeof v.homeFeedQuotePostsEnabled === 'boolean'
      ) {
        this.homeFeedQuotePostsEnabled = v.homeFeedQuotePostsEnabled
      }
      // check if requiring alt text is enabled in preferences, then hydrate
      if (
        hasProp(v, 'requireAltTextEnabled') &&
        typeof v.requireAltTextEnabled === 'boolean'
      ) {
        this.requireAltTextEnabled = v.requireAltTextEnabled
      }
    }
  }

  /**
   * This function fetches preferences and sets defaults for missing items.
   */
  async sync({clearCache}: {clearCache?: boolean} = {}) {
    await this.lock.acquireAsync()
    try {
      // fetch preferences
      let hasSavedFeedsPref = false
      const res = await this.rootStore.agent.app.bsky.actor.getPreferences({})
      runInAction(() => {
        for (const pref of res.data.preferences) {
          if (
            AppBskyActorDefs.isAdultContentPref(pref) &&
            AppBskyActorDefs.validateAdultContentPref(pref).success
          ) {
            this.adultContentEnabled = pref.enabled
          } else if (
            AppBskyActorDefs.isContentLabelPref(pref) &&
            AppBskyActorDefs.validateAdultContentPref(pref).success
          ) {
            if (
              LABEL_GROUPS.includes(pref.label) &&
              VISIBILITY_VALUES.includes(pref.visibility)
            ) {
              this.contentLabels[pref.label as keyof LabelPreferencesModel] =
                pref.visibility as LabelPreference
            }
          } else if (
            AppBskyActorDefs.isSavedFeedsPref(pref) &&
            AppBskyActorDefs.validateSavedFeedsPref(pref).success
          ) {
            if (!isEqual(this.savedFeeds, pref.saved)) {
              this.savedFeeds = pref.saved
            }
            if (!isEqual(this.pinnedFeeds, pref.pinned)) {
              this.pinnedFeeds = pref.pinned
            }
            hasSavedFeedsPref = true
          }
        }
      })

      // set defaults on missing items
      if (!hasSavedFeedsPref) {
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
        res.data.preferences.push({
          $type: 'app.bsky.actor.defs#savedFeedsPref',
          saved,
          pinned,
        })
        await this.rootStore.agent.app.bsky.actor.putPreferences({
          preferences: res.data.preferences,
        })
      }
    } finally {
      this.lock.release()
    }

    await this.rootStore.me.savedFeeds.updateCache(clearCache)
  }

  /**
   * This function updates the preferences of a user and allows for a callback function to be executed
   * before the update.
   * @param cb - cb is a callback function that takes in a single parameter of type
   * AppBskyActorDefs.Preferences and returns either a boolean or void. This callback function is used to
   * update the preferences of the user. The function is called with the current preferences as an
   * argument and if the callback returns false, the preferences are not updated.
   * @returns void
   */
  async update(
    cb: (
      prefs: AppBskyActorDefs.Preferences,
    ) => AppBskyActorDefs.Preferences | false,
  ) {
    await this.lock.acquireAsync()
    try {
      const res = await this.rootStore.agent.app.bsky.actor.getPreferences({})
      const newPrefs = cb(res.data.preferences)
      if (newPrefs === false) {
        return
      }
      await this.rootStore.agent.app.bsky.actor.putPreferences({
        preferences: newPrefs,
      })
    } finally {
      this.lock.release()
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
        this.contentLanguages = deviceLocales
        this.postLanguages = deviceLocales
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

  hasContentLanguage(code2: string) {
    return this.contentLanguages.includes(code2)
  }

  toggleContentLanguage(code2: string) {
    if (this.hasContentLanguage(code2)) {
      this.contentLanguages = this.contentLanguages.filter(
        lang => lang !== code2,
      )
    } else {
      this.contentLanguages = this.contentLanguages.concat([code2])
    }
  }

  hasPostLanguage(code2: string) {
    return this.postLanguages.includes(code2)
  }

  togglePostLanguage(code2: string) {
    if (this.hasPostLanguage(code2)) {
      this.postLanguages = this.postLanguages.filter(lang => lang !== code2)
    } else {
      this.postLanguages = this.postLanguages.concat([code2])
    }
  }

  getReadablePostLanguages() {
    const all = this.postLanguages.map(code2 => {
      const lang = LANGUAGES.find(l => l.code2 === code2)
      return lang ? lang.name : code2
    })
    return all.join(', ')
  }

  async setContentLabelPref(
    key: keyof LabelPreferencesModel,
    value: LabelPreference,
  ) {
    this.contentLabels[key] = value

    await this.update((prefs: AppBskyActorDefs.Preferences) => {
      const existing = prefs.find(
        pref =>
          AppBskyActorDefs.isContentLabelPref(pref) &&
          AppBskyActorDefs.validateAdultContentPref(pref).success &&
          pref.label === key,
      )
      if (existing) {
        existing.visibility = value
      } else {
        prefs.push({
          $type: 'app.bsky.actor.defs#contentLabelPref',
          label: key,
          visibility: value,
        })
      }
      return prefs
    })
  }

  async setAdultContentEnabled(v: boolean) {
    this.adultContentEnabled = v
    await this.update((prefs: AppBskyActorDefs.Preferences) => {
      const existing = prefs.find(
        pref =>
          AppBskyActorDefs.isAdultContentPref(pref) &&
          AppBskyActorDefs.validateAdultContentPref(pref).success,
      )
      if (existing) {
        existing.enabled = v
      } else {
        prefs.push({
          $type: 'app.bsky.actor.defs#adultContentPref',
          enabled: v,
        })
      }
      return prefs
    })
  }

  getLabelPreference(labels: ComAtprotoLabelDefs.Label[] | undefined): {
    pref: LabelPreference
    desc: LabelValGroup
  } {
    let res: {pref: LabelPreference; desc: LabelValGroup} = {
      pref: 'show',
      desc: UNKNOWN_LABEL_GROUP,
    }
    if (!labels?.length) {
      return res
    }
    for (const label of labels) {
      const group = getLabelValueGroup(label.val)
      if (group.id === 'illegal') {
        return {pref: 'hide', desc: ILLEGAL_LABEL_GROUP}
      } else if (group.id === 'always-filter') {
        return {pref: 'hide', desc: ALWAYS_FILTER_LABEL_GROUP}
      } else if (group.id === 'always-warn') {
        res.pref = 'warn'
        res.desc = ALWAYS_WARN_LABEL_GROUP
        continue
      } else if (group.id === 'unknown') {
        continue
      }
      let pref = this.contentLabels[group.id]
      if (pref === 'hide') {
        res.pref = 'hide'
        res.desc = group
      } else if (pref === 'warn' && res.pref === 'show') {
        res.pref = 'warn'
        res.desc = group
      }
    }
    if (res.desc.isAdultImagery && !this.adultContentEnabled) {
      res.pref = 'hide'
    }
    return res
  }

  async setSavedFeeds(saved: string[], pinned: string[]) {
    const oldSaved = this.savedFeeds
    const oldPinned = this.pinnedFeeds
    this.savedFeeds = saved
    this.pinnedFeeds = pinned
    try {
      await this.update((prefs: AppBskyActorDefs.Preferences) => {
        let feedsPref = prefs.find(
          pref =>
            AppBskyActorDefs.isSavedFeedsPref(pref) &&
            AppBskyActorDefs.validateSavedFeedsPref(pref).success,
        )
        if (feedsPref) {
          feedsPref.saved = saved
          feedsPref.pinned = pinned
        } else {
          feedsPref = {
            $type: 'app.bsky.actor.defs#savedFeedsPref',
            saved,
            pinned,
          }
        }
        return prefs
          .filter(pref => !AppBskyActorDefs.isSavedFeedsPref(pref))
          .concat([feedsPref])
      })
    } catch (e) {
      runInAction(() => {
        this.savedFeeds = oldSaved
        this.pinnedFeeds = oldPinned
      })
      throw e
    }
  }

  async addSavedFeed(v: string) {
    return this.setSavedFeeds([...this.savedFeeds, v], this.pinnedFeeds)
  }

  async removeSavedFeed(v: string) {
    return this.setSavedFeeds(
      this.savedFeeds.filter(uri => uri !== v),
      this.pinnedFeeds.filter(uri => uri !== v),
    )
  }

  async addPinnedFeed(v: string) {
    return this.setSavedFeeds(this.savedFeeds, [...this.pinnedFeeds, v])
  }

  async removePinnedFeed(v: string) {
    return this.setSavedFeeds(
      this.savedFeeds,
      this.pinnedFeeds.filter(uri => uri !== v),
    )
  }

  toggleHomeFeedRepliesEnabled() {
    this.homeFeedRepliesEnabled = !this.homeFeedRepliesEnabled
  }

  setHomeFeedRepliesThreshold(threshold: number) {
    this.homeFeedRepliesThreshold = threshold
  }

  toggleHomeFeedRepostsEnabled() {
    this.homeFeedRepostsEnabled = !this.homeFeedRepostsEnabled
  }

  toggleHomeFeedQuotePostsEnabled() {
    this.homeFeedQuotePostsEnabled = !this.homeFeedQuotePostsEnabled
  }

  toggleRequireAltTextEnabled() {
    this.requireAltTextEnabled = !this.requireAltTextEnabled
  }
}
