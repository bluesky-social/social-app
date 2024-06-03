import React from 'react'
import {Platform} from 'react-native'
import {requireNativeModule, requireNativeViewManager} from 'expo-modules-core'

import {ExpoBlueskyTranslateModule} from './ExpoBlueskyTranslate.types'

export const NativeTranslationModule =
  requireNativeModule<ExpoBlueskyTranslateModule>('ExpoBlueskyTranslate')

const NativeView: React.ComponentType = requireNativeViewManager(
  'ExpoBlueskyTranslate',
)

export function NativeTranslationView() {
  return <NativeView />
}

// can be something like "17.5.1", so just take the first two parts
const version = String(Platform.Version).split('.').slice(0, 2).join('.')

export const isAvailable = Number(version) >= 17.4

// https://en.wikipedia.org/wiki/Translate_(Apple)#Languages
const SUPPORTED_LANGUAGES = [
  'ar',
  'zh',
  'zh',
  'nl',
  'en',
  'en',
  'fr',
  'de',
  'id',
  'it',
  'ja',
  'ko',
  'pl',
  'pt',
  'ru',
  'es',
  'th',
  'tr',
  'uk',
  'vi',
]

export function isLanguageSupported(lang?: string) {
  // If the language is not provided, we assume it is supported
  if (!lang) return true
  return SUPPORTED_LANGUAGES.includes(lang)
}
