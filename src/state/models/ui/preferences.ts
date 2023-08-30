import {makeAutoObservable, runInAction} from 'mobx'
import {LabelPreference as APILabelPreference} from '@atproto/api'
import AwaitLock from 'await-lock'
import isEqual from 'lodash.isequal'
import {isObj, hasProp} from 'lib/type-guards'
import {RootStoreModel} from '../root-store'
import {ModerationOpts} from '@atproto/api'
import {DEFAULT_FEEDS} from 'lib/constants'
import {deviceLocales} from 'platform/detection'
import {LANGUAGES} from '../../../locale/languages'

// TEMP we need to permanently convert 'show' to 'ignore', for now we manually convert -prf
export type LabelPreference = APILabelPreference | 'show'
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
const DEFAULT_LANG_CODES = (deviceLocales || [])
  .concat(['en', 'ja', 'pt', 'de'])
  .slice(0, 6)

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
  contentLanguages: string[] = deviceLocales || []
  postLanguage: string = deviceLocales[0] || 'en'
  postLanguageHistory: string[] = DEFAULT_LANG_CODES
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
      postLanguage: this.postLanguage,
      postLanguageHistory: this.postLanguageHistory,
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
      if (hasProp(v, 'postLanguage') && typeof v.postLanguage === 'string') {
        this.postLanguage = v.postLanguage
      } else {
        // default to the device languages
        this.postLanguage = deviceLocales[0] || 'en'
      }
      if (
        hasProp(v, 'postLanguageHistory') &&
        Array.isArray(v.postLanguageHistory) &&
        typeof v.postLanguageHistory.every(item => typeof item === 'string')
      ) {
        this.postLanguageHistory = v.postLanguageHistory
          .concat(DEFAULT_LANG_CODES)
          .slice(0, 6)
      } else {
        // default to a starter set
        this.postLanguageHistory = DEFAULT_LANG_CODES
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
      const prefs = await this.rootStore.agent.getPreferences()

      runInAction(() => {
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
      })

      // set defaults on missing items
      if (typeof prefs.feeds.saved === 'undefined') {
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
      }
    } finally {
      this.lock.release()
    }

    await this.rootStore.me.savedFeeds.updateCache(clearCache)
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
        this.postLanguage = deviceLocales ? deviceLocales.join(',') : 'en'
        this.postLanguageHistory = DEFAULT_LANG_CODES
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

  /**
   * A getter that splits `this.postLanguage` into an array of strings.
   *
   * This was previously the main field on this model, but now we're
   * concatenating lang codes to make multi-selection a little better.
   */
  get postLanguages() {
    // filter out empty strings if exist
    return this.postLanguage.split(',').filter(Boolean)
  }

  hasPostLanguage(code2: string) {
    return this.postLanguages.includes(code2)
  }

  togglePostLanguage(code2: string) {
    if (this.hasPostLanguage(code2)) {
      this.postLanguage = this.postLanguages
        .filter(lang => lang !== code2)
        .join(',')
    } else {
      // sort alphabetically for deterministic comparison in context menu
      this.postLanguage = this.postLanguages
        .concat([code2])
        .sort((a, b) => a.localeCompare(b))
        .join(',')
    }
  }

  setPostLanguage(commaSeparatedLangCodes: string) {
    this.postLanguage = commaSeparatedLangCodes
  }

  /**
   * Saves whatever language codes are currently selected into a history array,
   * which is then used to populate the language selector menu.
   */
  savePostLanguageToHistory() {
    // filter out duplicate `this.postLanguage` if exists, and prepend
    // value to start of array
    this.postLanguageHistory = [this.postLanguage]
      .concat(
        this.postLanguageHistory.filter(
          commaSeparatedLangCodes =>
            commaSeparatedLangCodes !== this.postLanguage,
        ),
      )
      .slice(0, 6)
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

  async _optimisticUpdateSavedFeeds(
    saved: string[],
    pinned: string[],
    cb: () => Promise<{saved: string[]; pinned: string[]}>,
  ) {
    const oldSaved = this.savedFeeds
    const oldPinned = this.pinnedFeeds
    this.savedFeeds = saved
    this.pinnedFeeds = pinned
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
    }
  }

  async setSavedFeeds(saved: string[], pinned: string[]) {
    return this._optimisticUpdateSavedFeeds(saved, pinned, () =>
      this.rootStore.agent.setSavedFeeds(saved, pinned),
    )
  }

  async addSavedFeed(v: string) {
    return this._optimisticUpdateSavedFeeds(
      [...this.savedFeeds, v],
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
      this.savedFeeds,
      [...this.pinnedFeeds, v],
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

// TEMP we need to permanently convert 'show' to 'ignore', for now we manually convert -prf
function tempfixLabelPref(pref: LabelPreference): APILabelPreference {
  if (pref === 'show') {
    return 'ignore'
  }
  return pref
}
