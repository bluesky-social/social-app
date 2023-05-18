import {makeAutoObservable, runInAction} from 'mobx'
import {getLocales} from 'expo-localization'
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
import {isIOS} from 'platform/detection'

const deviceLocales = getLocales()

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
  contentLanguages: string[] =
    deviceLocales?.map?.(locale => locale.languageCode) || []
  contentLabels = new LabelPreferencesModel()
  pinnedFeeds: string[] = []

  constructor(public rootStore: RootStoreModel) {
    makeAutoObservable(this, {}, {autoBind: true})
  }

  serialize() {
    return {
      contentLanguages: this.contentLanguages,
      contentLabels: this.contentLabels,
      pinnedFeeds: this.pinnedFeeds,
    }
  }

  hydrate(v: unknown) {
    if (isObj(v)) {
      if (
        hasProp(v, 'contentLanguages') &&
        Array.isArray(v.contentLanguages) &&
        typeof v.contentLanguages.every(item => typeof item === 'string')
      ) {
        this.contentLanguages = v.contentLanguages
      }
      if (hasProp(v, 'contentLabels') && typeof v.contentLabels === 'object') {
        Object.assign(this.contentLabels, v.contentLabels)
      } else {
        // default to the device languages
        this.contentLanguages = deviceLocales.map(locale => locale.languageCode)
      }
      if (
        hasProp(v, 'pinnedFeeds') &&
        Array.isArray(v.pinnedFeeds) &&
        typeof v.pinnedFeeds.every(item => typeof item === 'string')
      ) {
        this.pinnedFeeds = v.pinnedFeeds
      }
    }
  }

  async sync() {
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
          AppBskyActorDefs.isPinnedFeedsPref(pref) &&
          AppBskyActorDefs.validatePinnedFeedsPref(pref).success
        ) {
          this.pinnedFeeds = pref.feeds
        }
      }
    })
  }

  async update(cb: (prefs: AppBskyActorDefs.Preferences) => void) {
    const res = await this.rootStore.agent.app.bsky.actor.getPreferences({})
    cb(res.data.preferences)
    await this.rootStore.agent.app.bsky.actor.putPreferences({
      preferences: res.data.preferences,
    })
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

  async setPinnedFeeds(v: string[]) {
    const old = this.pinnedFeeds
    this.pinnedFeeds = v
    try {
      await this.update((prefs: AppBskyActorDefs.Preferences) => {
        const existing = prefs.find(
          pref =>
            AppBskyActorDefs.isPinnedFeedsPref(pref) &&
            AppBskyActorDefs.validatePinnedFeedsPref(pref).success,
        )
        if (existing) {
          existing.feeds = v
        } else {
          prefs.push({
            $type: 'app.bsky.actor.defs#pinnedFeedsPref',
            feeds: v,
          })
        }
      })
    } catch (e) {
      runInAction(() => {
        this.pinnedFeeds = old
      })
      throw e
    }
  }

  async addPinnedFeed(v: string) {
    return this.setPinnedFeeds([...this.pinnedFeeds, v])
  }

  async removePinnedFeed(v: string) {
    return this.setPinnedFeeds(this.pinnedFeeds.filter(uri => uri !== v))
  }
}
