import {makeAutoObservable} from 'mobx'
import {getLocales} from 'expo-localization'
import {isObj, hasProp} from 'lib/type-guards'
import {ComAtprotoLabelDefs} from '@atproto/api'
import {getLabelValueGroup} from 'lib/labeling/helpers'
import {
  LabelValGroup,
  UNKNOWN_LABEL_GROUP,
  ILLEGAL_LABEL_GROUP,
} from 'lib/labeling/const'

const deviceLocales = getLocales()

export type LabelPreference = 'show' | 'warn' | 'hide'

export class LabelPreferencesModel {
  nsfw: LabelPreference = 'warn'
  gore: LabelPreference = 'hide'
  hate: LabelPreference = 'hide'
  spam: LabelPreference = 'hide'
  impersonation: LabelPreference = 'warn'

  constructor() {
    makeAutoObservable(this, {}, {autoBind: true})
  }
}

export class PreferencesModel {
  _contentLanguages: string[] | undefined
  contentLabels = new LabelPreferencesModel()

  constructor() {
    makeAutoObservable(this, {}, {autoBind: true})
  }

  // gives an array of BCP 47 language tags without region codes
  get contentLanguages() {
    if (this._contentLanguages) {
      return this._contentLanguages
    }
    return deviceLocales.map(locale => locale.languageCode)
  }

  serialize() {
    return {
      contentLanguages: this._contentLanguages,
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
        this._contentLanguages = v.contentLanguages
      }
      if (hasProp(v, 'contentLabels') && typeof v.contentLabels === 'object') {
        Object.assign(this.contentLabels, v.contentLabels)
      }
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
    return res
  }
}
