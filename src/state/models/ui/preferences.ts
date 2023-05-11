import {makeAutoObservable} from 'mobx'
import {getLocales} from 'expo-localization'
import {isObj, hasProp} from 'lib/type-guards'
import {ComAtprotoLabelDefs} from '@atproto/api'
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

  constructor() {
    makeAutoObservable(this, {}, {autoBind: true})
  }

  serialize() {
    return {
      contentLanguages: this.contentLanguages,
      contentLabels: this.contentLabels,
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

  setContentLabelPref(
    key: keyof LabelPreferencesModel,
    value: LabelPreference,
  ) {
    this.contentLabels[key] = value
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
}
