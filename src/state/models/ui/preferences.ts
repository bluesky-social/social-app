import {makeAutoObservable} from 'mobx'
import {getLocales} from 'expo-localization'
import {isObj, hasProp} from 'lib/type-guards'

const deviceLocales = getLocales()

export class PreferencesModel {
  _contentLanguages: string[] | undefined

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
    }
  }
}
