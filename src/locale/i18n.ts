import {getLocales} from 'expo-localization'
import type {LanguageDetectorAsyncModule} from 'i18next'
import i18n from 'i18next'
import {initReactI18next} from 'react-i18next'
import resources from './resources'

const languageDetector: LanguageDetectorAsyncModule = {
  type: 'languageDetector',
  async: true,
  detect: callback => {
    callback(getLocales().at(0)?.languageTag)
  },
}

i18n.use(languageDetector).use(initReactI18next).init({
  debug: true,
  fallbackLng: 'en',
  resources,
})

// Make sure you add your custom format function AFTER the i18n.init() call.
i18n.services.formatter?.add('lowercase', value => {
  return value.toLowerCase()
})

export default i18n
